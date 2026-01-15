import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Bug, Activity, TestTube, Tablet, Shield, Settings, Cog, Plus, X, Save, Edit } from "lucide-react";
import { dashboardService } from "../services/dashboardService";
import { Dashboard } from "../types/dashboard";

interface SidebarProps {
  onDashboardsChange?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onDashboardsChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [showNewDashboardModal, setShowNewDashboardModal] = useState(false);
  const [newDashboardTitle, setNewDashboardTitle] = useState("");
  const [newDashboardPath, setNewDashboardPath] = useState("");
  const [newDashboardIcon, setNewDashboardIcon] = useState("Activity");

  useEffect(() => {
    const loadDashboards = async () => {
      const loadedDashboards = await dashboardService.getAllDashboards();
      setDashboards(loadedDashboards);
    };
    loadDashboards();
  }, []);

  const reloadDashboards = async () => {
    await dashboardService.reloadDashboards();
    const loadedDashboards = await dashboardService.getAllDashboards();
    setDashboards(loadedDashboards);
  };

  // Icon mapping for dashboard types
  const getDashboardIcon = (iconName?: string) => {
    // Check if iconName is a URL
    const isUrl =
      iconName &&
      (iconName.startsWith("http://") ||
        iconName.startsWith("https://") ||
        iconName.endsWith(".jpg") ||
        iconName.endsWith(".jpeg") ||
        iconName.endsWith(".png") ||
        iconName.endsWith(".svg") ||
        iconName.endsWith(".webp") ||
        iconName.endsWith(".gif"));

    if (isUrl) {
      // Return a component that renders an image
      return ({ className }: { className?: string }) => <img src={iconName} alt="Dashboard icon" className={className || "w-5 h-5 object-contain"} />;
    }

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
    { id: "settings", icon: Cog, label: "Settings", path: "/settings" },
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

  const handleCreateDashboard = async () => {
    if (!newDashboardTitle.trim() || !newDashboardPath.trim()) return;

    const newDashboard: Dashboard = {
      id: `dashboard-${Date.now()}`,
      title: newDashboardTitle,
      path: newDashboardPath.startsWith("/") ? newDashboardPath : `/${newDashboardPath}`,
      description: "",
      icon: newDashboardIcon,
      backgroundColor: "bg-gray-900",
      columns: [
        {
          id: "col-1",
          title: "Column 1",
          gridColumns: { sm: 1, md: 2, lg: 3, xl: 4 },
          cards: [],
        },
      ],
      layout: "grid",
      minColumns: 12,
      minRows: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dashboardService.addDashboard(newDashboard);
    await reloadDashboards();

    // Reset modal
    setShowNewDashboardModal(false);
    setNewDashboardTitle("");
    setNewDashboardPath("");
    setNewDashboardIcon("Activity");

    // Notify parent to reload dashboards and routes
    if (onDashboardsChange) {
      onDashboardsChange();
    }

    // Navigate to new dashboard after a short delay to allow routes to update
    setTimeout(() => {
      navigate(newDashboard.path);
    }, 100);
  };

  return (
    <>
      <div className="fixed left-0 top-0 h-full w-16 min-w-16 max-w-16 bg-gray-900 flex flex-col items-center py-4 z-40">
        {/* Logo/Icon */}
        <div className="mb-8">
          <Activity className="w-8 h-8 text-blue-400" />
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

                {/* Edit button for active dashboard (not system tabs) */}
                {isActive &&
                  tab.path &&
                  !tab.path.includes("/debug") &&
                  !tab.path.includes("/tests") &&
                  !tab.path.includes("/manager") &&
                  !tab.path.includes("/settings") && (
                    <button
                      onClick={() => navigate(`${tab.path}?edit=true`)}
                      className="absolute right-0 top-0 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110"
                      title="Edit Dashboard"
                    >
                      <Edit className="w-2.5 h-2.5 text-black" />
                    </button>
                  )}
              </div>
            );
          })}
        </nav>

        {/* Add Dashboard Button */}
        <button
          onClick={() => setShowNewDashboardModal(true)}
          className="p-3 rounded-lg transition-all duration-200 text-gray-400 hover:bg-green-600/20 hover:text-green-400 group relative mt-4"
          title="Add Dashboard"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* New Dashboard Modal */}
      {showNewDashboardModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl w-[500px] max-w-[90vw] p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Plus className="w-6 h-6 text-green-400" />
                New Dashboard
              </h2>
              <button
                onClick={() => setShowNewDashboardModal(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Dashboard Title</label>
                <input
                  type="text"
                  value={newDashboardTitle}
                  onChange={(e) => setNewDashboardTitle(e.target.value)}
                  placeholder="My Dashboard"
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">URL Path</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">/</span>
                  <input
                    type="text"
                    value={newDashboardPath}
                    onChange={(e) => setNewDashboardPath(e.target.value.replace(/^\//, "").replace(/\s+/g, "-").toLowerCase())}
                    placeholder="my-dashboard"
                    className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">URL will be: /{newDashboardPath || "my-dashboard"}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
                <select
                  value={newDashboardIcon}
                  onChange={(e) => setNewDashboardIcon(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                >
                  <option value="Activity">Activity</option>
                  <option value="Home">Home</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Shield">Shield</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => setShowNewDashboardModal(false)} className="px-4 py-2 text-gray-400 hover:text-gray-300 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleCreateDashboard}
                disabled={!newDashboardTitle.trim() || !newDashboardPath.trim()}
                className={`px-6 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg ${
                  !newDashboardTitle.trim() || !newDashboardPath.trim() ? "opacity-50 cursor-not-allowed" : "hover:shadow-xl hover:scale-105"
                }`}
              >
                <Save className="w-4 h-4" />
                Create Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
