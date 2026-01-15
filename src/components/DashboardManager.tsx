import React, { useState, useEffect } from "react";
import { Dashboard } from "../types/dashboard";
import { dashboardService } from "../services/dashboardService";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";

interface DashboardManagerProps {
  onDashboardChange?: () => void;
}

export const DashboardManager: React.FC<DashboardManagerProps> = ({ onDashboardChange }) => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadDashboards();
  }, []);

  const loadDashboards = async () => {
    const loadedDashboards = await dashboardService.getAllDashboards();
    setDashboards(loadedDashboards);
  };

  const handleEdit = (dashboard: Dashboard) => {
    setEditingDashboard({ ...dashboard });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this dashboard?")) {
      await dashboardService.deleteDashboard(id);
      await loadDashboards();
      onDashboardChange?.();
    }
  };

  const handleSave = async () => {
    if (editingDashboard) {
      const now = new Date().toISOString();
      const dashboardToSave: Dashboard = {
        ...editingDashboard,
        createdAt: editingDashboard.createdAt || now,
        updatedAt: now,
      };

      const exists = dashboards.some((d) => d.id === dashboardToSave.id);

      if (showAddForm || !exists) {
        await dashboardService.addDashboard(dashboardToSave);
      } else {
        await dashboardService.updateDashboard(dashboardToSave.id, dashboardToSave);
        await dashboardService.saveDashboardToFile(dashboardToSave.id, dashboardToSave);
      }

      await loadDashboards();
      setIsEditing(false);
      setEditingDashboard(null);
      setShowAddForm(false);
      onDashboardChange?.();
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingDashboard(null);
    setShowAddForm(false);
  };

  const handleAddNew = () => {
    const newDashboard: Dashboard = {
      id: `dashboard-${Date.now()}`,
      title: "New Dashboard",
      path: `/dashboard-${Date.now()}`,
      description: "",
      icon: "Activity",
      columns: [],
      layout: "grid",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingDashboard(newDashboard);
    setShowAddForm(true);
    setIsEditing(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Dashboard Manager</h1>
        <button onClick={handleAddNew} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Add Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboards.map((dashboard) => (
          <div key={dashboard.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-white">{dashboard.title}</h3>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(dashboard)} className="p-2 text-blue-400 hover:bg-blue-400/20 rounded-lg transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(dashboard.id)} className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-4">{dashboard.description}</p>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Path:</span>
                <span className="text-gray-300">{dashboard.path}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Columns:</span>
                <span className="text-gray-300">{dashboard.columns.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Cards:</span>
                <span className="text-gray-300">{dashboard.columns.reduce((total, col) => total + col.cards.length, 0)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isEditing && editingDashboard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">{showAddForm ? "Add Dashboard" : "Edit Dashboard"}</h2>
              <button onClick={handleCancel} className="p-2 text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={editingDashboard.title}
                  onChange={(e) =>
                    setEditingDashboard({
                      ...editingDashboard,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Path</label>
                <input
                  type="text"
                  value={editingDashboard.path}
                  onChange={(e) =>
                    setEditingDashboard({
                      ...editingDashboard,
                      path: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={editingDashboard.description || ""}
                  onChange={(e) =>
                    setEditingDashboard({
                      ...editingDashboard,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
                <select
                  value={editingDashboard.icon || "Activity"}
                  onChange={(e) =>
                    setEditingDashboard({
                      ...editingDashboard,
                      icon: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Home">Home</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Shield">Shield</option>
                  <option value="Activity">Activity</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Background Color</label>
                <select
                  value={editingDashboard.backgroundColor || "bg-gray-900"}
                  onChange={(e) =>
                    setEditingDashboard({
                      ...editingDashboard,
                      backgroundColor: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bg-gray-900">Dark Gray</option>
                  <option value="bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900">Gray Gradient</option>
                  <option value="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">Blue Gradient</option>
                  <option value="bg-gradient-to-br from-red-900 via-red-800 to-rose-900">Red Gradient</option>
                  <option value="bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">Green Gradient</option>
                  <option value="bg-gradient-to-br from-purple-900 via-purple-800 to-violet-900">Purple Gradient</option>
                  <option value="bg-gradient-to-br from-orange-900 via-orange-800 to-amber-900">Orange Gradient</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button onClick={handleCancel} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
