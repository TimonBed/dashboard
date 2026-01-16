import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutGrid, Bug, TestTube, Cog, Home } from "lucide-react";
import { useSettingsStore } from "../store/useSettingsStore";

interface SidebarProps {
  onDashboardsChange?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onDashboardsChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  void onDashboardsChange;
  const { defaultDashboardPath } = useSettingsStore();

  // Tabs (non-dashboard pages)
  const tabs = [
    { id: "default-dashboard", icon: Home, label: "Default Dashboard", path: defaultDashboardPath || "/tabletdashboard" },
    { id: "dashboards", icon: LayoutGrid, label: "Dashboard Management", path: "/manager" },
    { id: "debug", icon: Bug, label: "WebSocket Debug", path: "/debug" },
    { id: "tests", icon: TestTube, label: "UI Tests", path: "/tests" },
    { id: "settings", icon: Cog, label: "Settings", path: "/settings" },
  ];

  const handleTabClick = (tab: (typeof tabs)[0]) => {
    navigate(tab.path);
  };

  return (
    <>
      <div className="fixed left-0 top-0 h-full w-16 min-w-16 max-w-16 bg-gray-900 flex flex-col items-center py-4 z-40">
        {/* Logo/Icon */}
        <div className="mb-8">
          <LayoutGrid className="w-8 h-8 text-blue-400" />
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-col space-y-4 flex-1 overflow-y-auto overflow-x-hidden w-full items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path;

            return (
              <div key={tab.id} className="relative group">
                <button
                  onClick={() => handleTabClick(tab)}
                  className={`
                    relative p-3 rounded-lg transition-all duration-200 group flex-shrink-0 w-full
                    ${isActive ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"}
                  `}
                  title={tab.label}
                >
                  <Icon className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </nav>
      </div>
    </>
  );
};
