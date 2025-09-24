import React, { useState, useEffect } from "react";
import { Activity, Wifi, WifiOff, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useHomeAssistantStore } from "../store/useHomeAssistantStore";
import { useHomeAssistant } from "../hooks/useHomeAssistant";

interface WebSocketMessage {
  id: string;
  timestamp: Date;
  type: "request" | "response" | "event";
  direction: "sent" | "received";
  message: any;
  status?: "pending" | "success" | "error";
}

export const WebSocketDebugPage: React.FC = () => {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [isRecording, setIsRecording] = useState(true);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  const { connectionType, isConnected, isLoading, error, websocketError, entities, sensors } = useHomeAssistantStore();
  const { wsInstance } = useHomeAssistant();

  // Load messages from WebSocket instance
  useEffect(() => {
    if (wsInstance) {
      // Get initial messages
      const initialMessages = wsInstance.getDebugMessages();
      setMessages(initialMessages);

      // Subscribe to new messages
      const unsubscribe = wsInstance.onDebugMessages((newMessages) => {
        if (isRecording) {
          setMessages(newMessages);
        }
      });

      return unsubscribe;
    }
  }, [wsInstance, isRecording]);

  // Clear messages
  const clearMessages = () => {
    if (wsInstance) {
      wsInstance.clearDebugMessages();
    }
    setMessages([]);
  };

  // Toggle message expansion
  const toggleMessage = (messageId: string) => {
    setExpandedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  // Get status icon
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  // Get message icon
  const getMessageIcon = (type: string, direction: string, message: any) => {
    if (direction === "sent") {
      return "📤";
    } else if (type === "event") {
      // Special icon for state changes
      if (message.event?.event_type === "state_changed") {
        return "🔄";
      }
      return "📡";
    } else {
      return "📥";
    }
  };

  // Get state change info
  const getStateChangeInfo = (message: any) => {
    if (message.event?.event_type === "state_changed") {
      const { entity_id, new_state } = message.event.data;
      const sensorName = new_state?.attributes?.friendly_name || entity_id;
      const newValue = new_state?.state;
      const unit = new_state?.attributes?.unit_of_measurement;
      const displayValue = unit ? `${newValue} ${unit}` : newValue;
      return { sensorName, displayValue };
    }
    return null;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString();
  };

  // Format JSON for display
  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">WebSocket Debug</h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                {isConnected ? <Wifi className="w-5 h-5 text-green-500" /> : <WifiOff className="w-5 h-5 text-red-500" />}
                <span className={`text-sm font-medium ${isConnected ? "text-green-600" : "text-red-600"}`}>{isConnected ? "Connected" : "Disconnected"}</span>
              </div>

              {/* Recording Toggle */}
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  isRecording ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {isRecording ? "Recording" : "Paused"}
              </button>

              {/* Clear Messages */}
              <button
                onClick={clearMessages}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex h-screen">
        {/* Messages Panel */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Messages Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">WebSocket Messages ({messages.length})</h2>
                <div className="text-sm text-gray-500">{connectionType === "websocket" ? "WebSocket" : "No Connection"}</div>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No messages recorded yet</p>
                  </div>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {messages.map((message) => (
                    <div key={message.id} className="bg-white rounded border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
                      <div className="p-2 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleMessage(message.id)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <span className="text-sm">{getMessageIcon(message.type, message.direction, message.message)}</span>
                            <div className="min-w-0 flex-1">
                              {(() => {
                                const stateChangeInfo = getStateChangeInfo(message.message);
                                if (stateChangeInfo) {
                                  return (
                                    <>
                                      <div className="text-xs font-medium text-gray-900 truncate">{stateChangeInfo.sensorName}</div>
                                      <div className="text-xs text-blue-600 font-semibold">{stateChangeInfo.displayValue}</div>
                                    </>
                                  );
                                }
                                return (
                                  <>
                                    <div className="text-xs font-medium text-gray-900 truncate">
                                      {message.type === "event" ? "Event" : message.message.type || "Message"}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {formatTimestamp(message.timestamp)} • {message.direction}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            {getStatusIcon(message.status)}
                            <span className="text-gray-400 text-xs">{expandedMessages.has(message.id) ? "▼" : "▶"}</span>
                          </div>
                        </div>
                      </div>

                      {expandedMessages.has(message.id) && (
                        <div className="border-t border-gray-200 bg-gray-50 p-2">
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto max-h-40">{formatJson(message.message)}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="w-64 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-base font-medium text-gray-900 mb-3">Connection Info</h3>

            {/* Status Cards */}
            <div className="space-y-2">
              <div className="bg-gray-50 rounded p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Activity className="w-3 h-3 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900">Status</span>
                </div>
                <div className="text-xs text-gray-600">{isLoading ? "Connecting..." : isConnected ? "Connected" : "Disconnected"}</div>
              </div>

              <div className="bg-gray-50 rounded p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Wifi className="w-3 h-3 text-green-500" />
                  <span className="text-sm font-medium text-gray-900">Type</span>
                </div>
                <div className="text-xs text-gray-600">{connectionType === "websocket" ? "WebSocket" : "None"}</div>
              </div>

              <div className="bg-gray-50 rounded p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Clock className="w-3 h-3 text-purple-500" />
                  <span className="text-sm font-medium text-gray-900">Messages</span>
                </div>
                <div className="text-xs text-gray-600">{messages.length} recorded</div>
              </div>

              <div className="bg-gray-50 rounded p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-sm font-medium text-gray-900">Entities</span>
                </div>
                <div className="text-xs text-gray-600">
                  {entities.size} total, {sensors.length} sensors
                </div>
              </div>
            </div>

            {/* Errors */}
            {(error || websocketError) && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Errors</h4>
                <div className="space-y-2">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <div className="flex items-start space-x-2">
                        <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-red-800">Connection Error</div>
                          <div className="text-xs text-red-700 mt-1">{error}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {websocketError && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-red-800">WebSocket Error</div>
                          <div className="text-xs text-red-700 mt-1">{websocketError}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
