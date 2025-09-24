import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { useHomeAssistantStore } from "../store/useHomeAssistantStore";

export const WebSocketError: React.FC = () => {
  const { connectionType, websocketError, setWebSocketError } = useHomeAssistantStore();

  if (connectionType !== "none" || !websocketError) {
    return null;
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-orange-800">WebSocket Connection Failed</h3>
          <div className="mt-2 text-sm text-orange-700">
            <p>WebSocket error:</p>
            <p className="mt-1 font-mono text-xs bg-orange-100 p-2 rounded">{websocketError}</p>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={() => setWebSocketError(null)}
              className="inline-flex rounded-md bg-orange-50 p-1.5 text-orange-500 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-2 focus:ring-offset-orange-50"
            >
              <span className="sr-only">Dismiss</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
