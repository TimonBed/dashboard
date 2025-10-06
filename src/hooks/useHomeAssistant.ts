import { useEffect, useRef } from "react";
import { HomeAssistantWebSocket } from "../services/websocket";
import { useHomeAssistantStore } from "../store/useHomeAssistantStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { StateChangedEvent } from "../types/homeassistant";

// Global connection state to prevent multiple connection attempts
let globalConnectionAttempted = false;
let globalWsInstance: HomeAssistantWebSocket | null = null;
let lastConnectionSettings = "";

export const useHomeAssistant = () => {
  const wsRef = useRef<HomeAssistantWebSocket | null>(null);
  const hasConnectedRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const retryDelay = 2000; // 2 seconds
  const { setEntities, updateEntity, setConnected, setLoading, setError, setConnectionType, setWebSocketError, isConnected, isLoading, error } =
    useHomeAssistantStore();
  const { homeAssistantIP, homeAssistantToken, getHomeAssistantURL } = useSettingsStore();

  // Build WebSocket URL from settings
  const getWebSocketURL = () => {
    if (!homeAssistantIP) return "";
    
    // If it's already a full URL, convert to WebSocket
    if (homeAssistantIP.startsWith('http')) {
      return homeAssistantIP.replace(/^https?:\/\//, 'ws://').replace(/^http:\/\//, 'ws://') + '/api/websocket';
    }
    
    // Check if port is already included
    const hasPort = homeAssistantIP.includes(':');
    const isDomain = homeAssistantIP.includes('.') || homeAssistantIP === 'localhost';
    const protocol = homeAssistantIP === "localhost" ? "ws" : "wss";
    
    if (hasPort) {
      // Port is already included, just add protocol and path
      return `${protocol}://${homeAssistantIP}/api/websocket`;
    } else if (isDomain) {
      // Domain without port, use default ports
      return `${protocol}://${homeAssistantIP}/api/websocket`;
    } else {
      // IP address without port, add default port
      return `${protocol}://${homeAssistantIP}:80/api/websocket`;
    }
  };

  useEffect(() => {
    // Don't connect if no settings are configured
    if (!homeAssistantIP || !homeAssistantToken) {
      setError("Please configure Home Assistant settings first");
      setLoading(false);
      return;
    }

    // Create a settings key to detect changes
    const currentSettings = `${homeAssistantIP}:${homeAssistantToken}`;
    
    // If settings changed, reset global state
    if (lastConnectionSettings && lastConnectionSettings !== currentSettings) {
      globalConnectionAttempted = false;
      globalWsInstance = null;
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
      hasConnectedRef.current = false;
    }

    // If global connection already attempted with same settings, just use the existing instance
    if (globalConnectionAttempted && globalWsInstance && lastConnectionSettings === currentSettings) {
      wsRef.current = globalWsInstance;
      hasConnectedRef.current = true;
      return;
    }

    // Prevent multiple connections with same settings
    if (wsRef.current || hasConnectedRef.current) {
      return;
    }

    const connect = async () => {
      try {
        setLoading(true);
        setError(null);

        const wsUrl = getWebSocketURL();
        if (!wsUrl) {
          throw new Error("Invalid WebSocket URL configuration");
        }
        
        console.log("Connecting to WebSocket with URL:", wsUrl);

        // Mark global connection as attempted
        globalConnectionAttempted = true;
        lastConnectionSettings = currentSettings;
        wsRef.current = HomeAssistantWebSocket.getInstance(wsUrl, homeAssistantToken);
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
  }, [homeAssistantIP, homeAssistantToken]);

  const reconnect = () => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    hasConnectedRef.current = false;
    retryCountRef.current = 0; // Reset retry count
    globalConnectionAttempted = false; // Reset global state
    globalWsInstance = null;
    lastConnectionSettings = ""; // Reset settings tracking
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
