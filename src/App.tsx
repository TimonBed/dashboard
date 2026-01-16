import { useState, useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { WebSocketDebugPage } from "./components/WebSocketDebugPage";
import { UITestsPage } from "./components/UITestsPage";
import { TabletDashboard } from "./components/TabletDashboard";
import { DynamicDashboard } from "./components/DynamicDashboard";
import { DashboardManager } from "./components/DashboardManager";
import { SettingsPage } from "./components/SettingsPage";
import { Notification } from "./components/Notification";
import { dashboardService } from "./services/dashboardService";
import { Dashboard } from "./types/dashboard";
import { useHomeAssistant } from "./hooks/useHomeAssistant";
import { useSettingsStore } from "./store/useSettingsStore";

function App() {
  // Keep HA connection alive for all routes (including direct loads like /annapc)
  useHomeAssistant();

  const { defaultDashboardPath } = useSettingsStore();
  const location = useLocation();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Check URL parameters for sidebar visibility
  const urlParams = new URLSearchParams(location.search);
  const hideSidebar = urlParams.get("sidebar") === "false" || urlParams.get("hidesidebar") === "true";

  useEffect(() => {
    const loadDashboards = async () => {
      const loadedDashboards = await dashboardService.getAllDashboards();
      setDashboards(loadedDashboards);
    };
    loadDashboards();
  }, []);

  const handleCardTitleChange = (cardId: string, title: string, entityId?: string) => {
    // Handle card title changes - could save to localStorage or update dashboard config
    console.log(`Card ${cardId} title changed to: ${title}, entityId: ${entityId}`);
  };

  const handleCardJsonSave = (dashboardId: string) => async (cardId: string, config: any) => {
    // Handle JSON configuration changes - update dashboard and save to file
    const success = await dashboardService.updateCardConfig(dashboardId, cardId, config);
    if (success) {
      // Reload dashboards to reflect changes (already done in updateCardConfig)
      const loadedDashboards = await dashboardService.getAllDashboards();
      setDashboards(loadedDashboards);

      // Show success notification
      setNotification(`Dashboard saved! Changes persisted to file.`);
    }
  };

  const handleDashboardChange = async () => {
    // Reload dashboards when they change
    const loadedDashboards = await dashboardService.getAllDashboards();
    setDashboards(loadedDashboards);
  };

  const renderDashboardRoute = (dashboard: Dashboard) => (
    <Route
      key={dashboard.id}
      path={dashboard.path}
      element={
        <DynamicDashboard
          dashboard={dashboard}
          onCardTitleChange={handleCardTitleChange}
          onCardJsonSave={handleCardJsonSave(dashboard.id)}
          onNotification={setNotification}
        />
      }
    />
  );

  const resolvedDefaultPath =
    dashboards.find((d) => d.path === defaultDashboardPath)?.path || defaultDashboardPath || dashboards[0]?.path || "/tabletdashboard";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {!hideSidebar && <Sidebar onDashboardsChange={handleDashboardChange} />}
      <div className={`flex-1 ${hideSidebar ? "ml-0" : "ml-16"}`}>
        <Routes>
          <Route path="/" element={<Navigate to={resolvedDefaultPath} replace />} />
          <Route path="/tabletdashboard" element={<TabletDashboard />} />
          <Route path="/debug" element={<WebSocketDebugPage />} />
          <Route path="/tests" element={<UITestsPage />} />
          <Route path="/manager" element={<DashboardManager onDashboardChange={handleDashboardChange} />} />
          <Route path="/settings" element={<SettingsPage />} />
          {dashboards.map(renderDashboardRoute)}
        </Routes>
      </div>

      {/* Success Notification */}
      {notification && <Notification message={notification} onClose={() => setNotification(null)} />}
    </div>
  );
}

export default App;
