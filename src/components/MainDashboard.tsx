import React from "react";
import { Header } from "./Header";
import { StatsCards } from "./StatsCards";
import { SensorGrid } from "./SensorGrid";
import { WebSocketError } from "./WebSocketError";
import { WebSocketDebug } from "./WebSocketDebug";
import { useHomeAssistant } from "../hooks/useHomeAssistant";

// MainDashboard component for the main dashboard page
const MainDashboard = () => {
  const { isConnected, isLoading, error } = useHomeAssistant();

  return (
    <>
      <Header />
      <main className="px-6 py-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ha-blue mx-auto mb-4"></div>
              <p className="text-gray-600">Connecting to Home Assistant...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 mr-2">⚠️</div>
              <div>
                <h3 className="text-red-800 font-medium">Connection Error</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {isConnected && (
          <>
            <WebSocketDebug />
            <WebSocketError />
            <StatsCards />
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Sensor Data</h2>
              <SensorGrid />
            </div>
          </>
        )}
      </main>
    </>
  );
};

export default MainDashboard;
