import React from "react";
import { Home, RefreshCw, Zap } from "lucide-react";
import { ConnectionStatus } from "./ConnectionStatus";
import { useHomeAssistant } from "../hooks/useHomeAssistant";
import { useHomeAssistantStore } from "../store/useHomeAssistantStore";

export const Header: React.FC = () => {
  const { reconnect } = useHomeAssistant();
  const { connectionType, isConnected } = useHomeAssistantStore();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Home className="w-6 h-6 text-ha-blue" />
            <h1 className="text-xl font-bold text-gray-900">Home Assistant Dashboard</h1>
            {isConnected && connectionType === "websocket" && (
              <div className="flex items-center space-x-1 ml-3">
                <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  <Zap className="w-3 h-3" />
                  <span>WebSocket</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <ConnectionStatus />
          <button
            onClick={reconnect}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reconnect</span>
          </button>
        </div>
      </div>
    </header>
  );
};
