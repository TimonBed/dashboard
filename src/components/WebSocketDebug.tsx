import React, { useState } from "react";
import { useHomeAssistantStore } from "../store/useHomeAssistantStore";

export const WebSocketDebug: React.FC = () => {
  const { connectionType, websocketError, isConnected } = useHomeAssistantStore();
  const [showDebug, setShowDebug] = useState(false);

  if (!showDebug) {
    return (
      <button onClick={() => setShowDebug(true)} className="text-xs text-gray-500 hover:text-gray-700 underline">
        Show WebSocket Debug
      </button>
    );
  }

  return (
    <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-800">WebSocket Debug Info</h3>
        <button onClick={() => setShowDebug(false)} className="text-xs text-gray-500 hover:text-gray-700">
          Hide
        </button>
      </div>

      <div className="text-xs space-y-1">
        <div>
          <strong>Connection Type:</strong> {connectionType}
        </div>
        <div>
          <strong>Is Connected:</strong> {isConnected ? "Yes" : "No"}
        </div>
        {websocketError && (
          <div>
            <strong>WebSocket Error:</strong>
            <pre className="mt-1 p-2 bg-red-50 text-red-800 rounded text-xs overflow-auto">{websocketError}</pre>
          </div>
        )}
        <div className="mt-2">
          <strong>Instructions:</strong>
          <ol className="list-decimal list-inside mt-1 space-y-1">
            <li>Open browser console (F12)</li>
            <li>Look for "WebSocket connected" message</li>
            <li>Check for "auth_required" or "auth_ok" messages</li>
            <li>Compare with Postman workflow</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
