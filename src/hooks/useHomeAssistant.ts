import { useEffect, useRef } from "react";
import { HomeAssistantWebSocket } from "../services/websocket";
import { useHomeAssistantStore } from "../store/useHomeAssistantStore";
import { StateChangedEvent } from "../types/homeassistant";

const WS_URL = "ws://192.168.1.4:8123/api/websocket";
const ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIzMWY2YjBiYjNlNGU0ZTJjODExMmY4ZWYyZDZjMTg3ZCIsImlhdCI6MTc1ODU3OTA3NiwiZXhwIjoyMDczOTM5MDc2fQ.2u_j6Ho_qj5EvuApGCye9Qbzl29be539VUjt67bWDIQ";

// Global connection state to prevent multiple connection attempts
let globalConnectionAttempted = false;
let globalWsInstance: HomeAssistantWebSocket | null = null;

export const useHomeAssistant = () => {
  const wsRef = useRef<HomeAssistantWebSocket | null>(null);
  const hasConnectedRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const retryDelay = 2000; // 2 seconds
  const { setEntities, updateEntity, setConnected, setLoading, setError, setConnectionType, setWebSocketError, isConnected, isLoading, error } =
    useHomeAssistantStore();

  useEffect(() => {
    // If global connection already attempted, just use the existing instance
    if (globalConnectionAttempted && globalWsInstance) {
      wsRef.current = globalWsInstance;
      hasConnectedRef.current = true;
      return;
    }

    // Prevent multiple connections
    if (wsRef.current || hasConnectedRef.current) {
      return;
    }

    const connect = async () => {
      try {
        setLoading(true);
        setError(null);

        // Mark global connection as attempted
        globalConnectionAttempted = true;
        wsRef.current = HomeAssistantWebSocket.getInstance(WS_URL, ACCESS_TOKEN);
        globalWsInstance = wsRef.current;

        // Connect and authenticate
        await wsRef.current.connect();

        // Get initial states
        const states = await wsRef.current.getStates();
        setEntities(states);

        // Set up state change listener BEFORE subscribing
        wsRef.current.on("event", (data: StateChangedEvent) => {
          if (data.event?.event_type === "state_changed") {
            const { new_state } = data.event.data;
            if (new_state) {
              updateEntity(new_state);
            }
          }
        });

        // Subscribe to state changes
        wsRef.current.subscribeToStateChanges();

        // Update UI state
        hasConnectedRef.current = true;
        retryCountRef.current = 0; // Reset retry count on success
        setConnected(true);
        setLoading(false);
        setError(null);
        setWebSocketError(null);
        setConnectionType("websocket");
      } catch (err) {
        retryCountRef.current++;
        console.warn(`Connection attempt ${retryCountRef.current}/${maxRetries} failed:`, err);

        if (retryCountRef.current < maxRetries) {
          // Wait before retrying
          console.log(`Retrying in ${retryDelay}ms...`);
          setTimeout(() => {
            if (!hasConnectedRef.current) {
              connect();
            }
          }, retryDelay);
          return;
        }

        // All retries failed
        console.error("Connection failed after 5 attempts:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        const wsError = `WebSocket connection failed after ${maxRetries} attempts: ${errorMessage}`;
        setWebSocketError(wsError);
        setError(wsError);
        setLoading(false);
        setConnectionType("none");
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
        hasConnectedRef.current = false;
      }
    };
  }, []);

  const reconnect = () => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    hasConnectedRef.current = false;
    retryCountRef.current = 0; // Reset retry count
    globalConnectionAttempted = false; // Reset global state
    globalWsInstance = null;
    window.location.reload();
  };

  const callService = async (domain: string, service: string, serviceData: any = {}) => {
    if (wsRef.current) {
      return await wsRef.current.callService(domain, service, serviceData);
    }
    throw new Error("WebSocket not connected");
  };

  return {
    isConnected,
    isLoading,
    error,
    reconnect,
    wsInstance: wsRef.current,
    callService,
  };
};
