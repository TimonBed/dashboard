import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Header } from "./components/Header";
import { StatsCards } from "./components/StatsCards";
import { SensorGrid } from "./components/SensorGrid";
import { WebSocketError } from "./components/WebSocketError";
import { WebSocketDebug } from "./components/WebSocketDebug";
import { Sidebar } from "./components/Sidebar";
import { WebSocketDebugPage } from "./components/WebSocketDebugPage";
import { UITestsPage } from "./components/UITestsPage";
import { TabletDashboard } from "./components/TabletDashboard";
import { DynamicDashboard } from "./components/DynamicDashboard";
import { DashboardManager } from "./components/DashboardManager";
import { SettingsPage } from "./components/SettingsPage";
import { useHomeAssistant } from "./hooks/useHomeAssistant";
import { dashboardService } from "./services/dashboardService";
import { Dashboard } from "./types/dashboard";

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

function App() {
  const location = useLocation();
  const activeTab = location.pathname;
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);

  // Check URL parameters for sidebar visibility
  const urlParams = new URLSearchParams(location.search);
  const hideSidebar = urlParams.get("sidebar") === "false" || urlParams.get("hidesidebar") === "true";

  useEffect(() => {
    const loadedDashboards = dashboardService.getAllDashboards();
    setDashboards(loadedDashboards);
  }, []);

  const handleCardTitleChange = (cardId: string, title: string, entityId?: string) => {
    // Handle card title changes - could save to localStorage or update dashboard config
    console.log(`Card ${cardId} title changed to: ${title}, entityId: ${entityId}`);
  };

  const handleDashboardChange = () => {
    // Reload dashboards when they change
    const loadedDashboards = dashboardService.getAllDashboards();
    setDashboards(loadedDashboards);
  };

  const renderDashboardRoute = (dashboard: Dashboard) => (
    <Route key={dashboard.id} path={dashboard.path} element={<DynamicDashboard dashboard={dashboard} onCardTitleChange={handleCardTitleChange} />} />
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {!hideSidebar && <Sidebar activeTab={activeTab} onTabChange={() => {}} />}
      <div className={`flex-1 ${hideSidebar ? "ml-0" : "ml-16"}`}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<MainDashboard />} />
          <Route path="/tabletdashboard" element={<TabletDashboard />} />
          <Route path="/debug" element={<WebSocketDebugPage />} />
          <Route path="/tests" element={<UITestsPage />} />
          <Route path="/manager" element={<DashboardManager onDashboardChange={handleDashboardChange} />} />
          <Route path="/settings" element={<SettingsPage />} />
          {dashboards.map(renderDashboardRoute)}
        </Routes>
      </div>
    </div>
  );
}

export default App;
