import { EntityState } from "../types/homeassistant";

interface DebugMessage {
  id: string;
  timestamp: Date;
  type: "request" | "response" | "event";
  direction: "sent" | "received";
  message: any;
  status?: "pending" | "success" | "error";
}

export class HomeAssistantWebSocket {
  private ws: WebSocket | null = null;
  private accessToken: string;
  private url: string;
  private isAuthenticated = false;
  private isConnecting = false;
  private messageId = 1;
  private eventHandlers = new Map<string, ((data: any) => void)[]>();
  private debugMessages: DebugMessage[] = [];
  private debugListeners = new Set<(messages: DebugMessage[]) => void>();

  constructor(url: string, accessToken: string) {
    this.url = url;
    this.accessToken = accessToken;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) return;

      this.isConnecting = true;
      console.log("Connecting to WebSocket:", this.url);

      const timeout = setTimeout(() => {
        this.ws?.close();
        this.isConnecting = false;
        reject(new Error("Connection timeout"));
      }, 10000);

      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => console.log("WebSocket connected");

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          this.addDebugMessage({
            type: message.type === "event" ? "event" : "response",
            direction: "received",
            message,
            status: "success",
          });

          switch (message.type) {
            case "auth_required":
              this.sendAuth();
              break;
            case "auth_ok":
              console.log("✓ WebSocket authenticated");
              this.isAuthenticated = true;
              this.isConnecting = false;
              clearTimeout(timeout);
              resolve();
              break;
            case "auth_invalid":
              console.error("✗ Authentication failed");
              this.isConnecting = false;
              clearTimeout(timeout);
              reject(new Error("Authentication failed"));
              break;
            case "event":
              if (message.event?.event_type === "state_changed") {
                const { entity_id, new_state } = message.event.data;
                const name = new_state?.attributes?.friendly_name || entity_id;
                const value = new_state?.state;
                const unit = new_state?.attributes?.unit_of_measurement;
                // console.log(`🔄 ${name}: ${unit ? `${value} ${unit}` : value}`);
              }
              this.emit("event", message);
              break;
            case "result":
              this.emit("result", message);
              break;
          }
        } catch (error) {
          console.error("WebSocket parse error:", error);
          this.addDebugMessage({
            type: "response",
            direction: "received",
            message: { error: "Parse error", data: event.data },
            status: "error",
          });
        }
      };

      this.ws.onclose = () => {
        console.log("WebSocket disconnected");
        this.isAuthenticated = false;
        this.isConnecting = false;
        clearTimeout(timeout);
      };

      this.ws.onerror = () => {
        console.error("WebSocket error");
        this.isConnecting = false;
        clearTimeout(timeout);
        reject(new Error("WebSocket connection failed"));
      };
    });
  }

  private sendAuth() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const authMessage = { type: "auth", access_token: this.accessToken };
      this.addDebugMessage({
        type: "request",
        direction: "sent",
        message: authMessage,
        status: "pending",
      });
      this.ws.send(JSON.stringify(authMessage));
    }
  }

  public getStates(): Promise<EntityState[]> {
    return new Promise((resolve, reject) => {
      if (!this.isAuthenticated || this.ws?.readyState !== WebSocket.OPEN) {
        reject(new Error("Not authenticated or connected"));
        return;
      }

      const messageId = this.messageId++;
      const message = { id: messageId, type: "get_states" };

      this.addDebugMessage({
        type: "request",
        direction: "sent",
        message,
        status: "pending",
      });

      this.ws.send(JSON.stringify(message));

      const handleResult = (data: any) => {
        if (data.id === messageId && data.type === "result") {
          this.off("result", handleResult);
          if (data.success) {
            console.log(`✓ Loaded ${data.result.length} entities`);
            resolve(data.result);
          } else {
            reject(new Error(`Failed to get states: ${data.error?.message || "Unknown error"}`));
          }
        }
      };

      this.on("result", handleResult);
      setTimeout(() => {
        this.off("result", handleResult);
        reject(new Error("Timeout waiting for states"));
      }, 10000);
    });
  }

  public subscribeToStateChanges() {
    if (!this.isAuthenticated || this.ws?.readyState !== WebSocket.OPEN) {
      console.error("Cannot subscribe - not authenticated or connected");
      return;
    }

    const messageId = this.messageId++;
    const message = { id: messageId, type: "subscribe_events", event_type: "state_changed" };

    this.addDebugMessage({
      type: "request",
      direction: "sent",
      message,
      status: "pending",
    });

    this.ws.send(JSON.stringify(message));

    const handleResult = (data: any) => {
      if (data.id === messageId && data.type === "result") {
        this.off("result", handleResult);
        console.log(data.success ? "✓ Subscribed to state changes" : "✗ Failed to subscribe to state changes");
      }
    };

    this.on("result", handleResult);
  }

  public on(event: string, handler: (data: any) => void) {
    if (!this.eventHandlers.has(event)) this.eventHandlers.set(event, []);
    this.eventHandlers.get(event)!.push(handler);
  }

  public off(event: string, handler: (data: any) => void) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    }
  }

  private emit(event: string, data: any) {
    this.eventHandlers.get(event)?.forEach((handler) => handler(data));
  }

  public disconnect() {
    this.ws?.close();
    this.ws = null;
    this.isAuthenticated = false;
    this.isConnecting = false;
    this.eventHandlers.clear();
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated;
  }

  private addDebugMessage(message: Omit<DebugMessage, "id" | "timestamp">) {
    const debugMessage = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      ...message,
    };

    this.debugMessages.unshift(debugMessage);
    if (this.debugMessages.length > 100) this.debugMessages = this.debugMessages.slice(0, 100);
    this.debugListeners.forEach((listener) => listener([...this.debugMessages]));
  }

  public getDebugMessages() {
    return [...this.debugMessages];
  }

  public onDebugMessages(listener: (messages: DebugMessage[]) => void) {
    this.debugListeners.add(listener);
    return () => this.debugListeners.delete(listener);
  }

  public clearDebugMessages() {
    this.debugMessages = [];
    this.debugListeners.forEach((listener) => listener([]));
  }

  public async callService(domain: string, service: string, serviceData: any = {}): Promise<any> {
    if (!this.isConnected()) {
      throw new Error("WebSocket not connected");
    }

    const message = {
      id: this.messageId++,
      type: "call_service",
      domain,
      service,
      service_data: serviceData,
    };

    this.addDebugMessage({
      type: "request",
      direction: "sent",
      message: `Call service: ${domain}.${service}`,
      status: "pending",
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Service call timeout: ${domain}.${service}`));
      }, 10000);

      const handler = (data: any) => {
        if (data.id === message.id) {
          clearTimeout(timeout);
          this.off("result", handler);

          if (data.success) {
            this.addDebugMessage({
              type: "response",
              direction: "received",
              message: `Service call success: ${domain}.${service}`,
              status: "success",
            });
            resolve(data.result);
          } else {
            this.addDebugMessage({
              type: "response",
              direction: "received",
              message: `Service call failed: ${domain}.${service}`,
              status: "error",
            });
            reject(new Error(data.error?.message || "Service call failed"));
          }
        }
      };

      this.on("result", handler);
      this.ws?.send(JSON.stringify(message));
    });
  }
}
