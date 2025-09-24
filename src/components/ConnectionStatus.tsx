import React from "react";
import { Wifi, WifiOff, Loader2, AlertCircle, Globe, Zap } from "lucide-react";
import { useHomeAssistantStore } from "../store/useHomeAssistantStore";

export const ConnectionStatus: React.FC = () => {
  const { isConnected, isLoading, error, lastUpdate, connectionType } = useHomeAssistantStore();

  const getStatusIcon = () => {
    if (isLoading) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    if (error) {
      return <AlertCircle className="w-4 h-4" />;
    }
    if (isConnected) {
      if (connectionType === "websocket") {
        return <Zap className="w-4 h-4" />;
      }
      return <Wifi className="w-4 h-4" />;
    }
    return <WifiOff className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (isLoading) {
      return "Connecting...";
    }
    if (error) {
      return `Error: ${error}`;
    }
    if (isConnected) {
      if (connectionType === "websocket") {
        return "WebSocket Connected";
      }
      return "Connected";
    }
    return "Disconnected";
  };

  const getStatusColor = () => {
    if (isLoading) {
      return "text-blue-600";
    }
    if (error) {
      return "text-red-600";
    }
    if (isConnected) {
      if (connectionType === "websocket") {
        return "text-green-600";
      }
      return "text-green-600";
    }
    return "text-gray-600";
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={getStatusColor()}>{getStatusIcon()}</div>
      <span className={getStatusColor()}>{getStatusText()}</span>
      {lastUpdate && isConnected && <span className="text-gray-500 text-xs">• Last update: {lastUpdate.toLocaleTimeString()}</span>}
    </div>
  );
};
