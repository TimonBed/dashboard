import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Bug, Activity, TestTube, Tablet, Shield, Settings } from "lucide-react";
import { dashboardService } from "../services/dashboardService";
import { Dashboard } from "../types/dashboard";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);

  useEffect(() => {
    const loadedDashboards = dashboardService.getAllDashboards();
    setDashboards(loadedDashboards);
  }, []);

  // Icon mapping for dashboard types
  const getDashboardIcon = (iconName?: string) => {
    switch (iconName) {
      case "Home":
        return Home;
      case "Tablet":
        return Tablet;
      case "Shield":
        return Shield;
      default:
        return Activity;
    }
  };

  // System tabs (non-dashboard pages)
  const systemTabs = [
    { id: "debug", icon: Bug, label: "WebSocket Debug", path: "/debug" },
    { id: "tests", icon: TestTube, label: "UI Tests", path: "/tests" },
    { id: "manager", icon: Settings, label: "Dashboard Manager", path: "/manager" },
  ];

  // Create tabs from dashboards
  const dashboardTabs = dashboards.map((dashboard) => ({
    id: dashboard.id,
    icon: getDashboardIcon(dashboard.icon),
    label: dashboard.title,
    path: dashboard.path,
  }));

  const tabs = [...dashboardTabs, ...systemTabs];

  const handleTabClick = (tab: (typeof tabs)[0]) => {
    navigate(tab.path);
  };

  return (
    <div className="fixed left-0 top-0 h-full w-16 bg-gray-900 flex flex-col items-center py-4 z-40">
      {/* Logo/Icon */}
      <div className="mb-8">
        <Activity className="w-8 h-8 text-blue-400" />
      </div>

      {/* Navigation Tabs */}
      <nav className="flex flex-col space-y-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`
                relative p-3 rounded-lg transition-all duration-200 group
                ${isActive ? "bg-blue-600 text-white" : "text-gray-400"}
              `}
              title={tab.label}
            >
              <Icon className="w-5 h-5" />

              {/* Tooltip */}
              <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                {tab.label}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Bottom spacer */}
      <div className="flex-1" />
    </div>
  );
};
