import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, ChevronDown, Pencil, Settings } from "lucide-react";
import { Dashboard } from "../types/dashboard";
import { dashboardService } from "../services/dashboardService";

interface DashboardHeaderProps {
  dashboard: Dashboard;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onOpenSettings: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ dashboard, isEditMode, onToggleEditMode, onOpenSettings }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [availableDashboards, setAvailableDashboards] = useState<Dashboard[]>([]);
  const [isDashboardMenuOpen, setIsDashboardMenuOpen] = useState(false);
  const dashboardMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const dashboards = await dashboardService.getAllDashboards();
        setAvailableDashboards(dashboards);
      } catch {
        setAvailableDashboards([]);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!isDashboardMenuOpen) return;

    const onMouseDown = (e: MouseEvent) => {
      const el = dashboardMenuRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setIsDashboardMenuOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsDashboardMenuOpen(false);
    };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isDashboardMenuOpen]);

  return (
    <div className="sticky top-0 z-30 -mx-6 px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-white font-semibold text-lg truncate">{dashboard.title}</div>
          {!!dashboard.description && <div className="text-xs text-gray-300/80 truncate">{dashboard.description}</div>}
        </div>

        <div className="flex items-center gap-2">
          {availableDashboards.length > 0 && (
            <div className="relative" ref={dashboardMenuRef}>
              <button
                type="button"
                onClick={() => setIsDashboardMenuOpen((v) => !v)}
                className="flex items-center gap-2 max-w-[14rem] sm:max-w-[18rem] px-3 py-2 rounded-xl bg-white/10 text-white text-sm border border-white/10 hover:bg-white/15 transition-colors"
                title="Switch dashboard"
              >
                <span className="truncate">{dashboard.title}</span>
                <ChevronDown className="w-4 h-4 opacity-80 flex-shrink-0" />
              </button>

              {isDashboardMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 max-w-[80vw] max-h-80 overflow-auto rounded-xl bg-gray-900/95 border border-white/10 shadow-2xl backdrop-blur-md">
                  {availableDashboards.map((d) => {
                    const isCurrent = d.id === dashboard.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          if (!isCurrent) {
                            navigate({
                              pathname: d.path,
                              search: location.search,
                            });
                          }
                          setIsDashboardMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                          isCurrent ? "text-white bg-white/10" : "text-white/90 hover:bg-white/10"
                        }`}
                      >
                        <div className="truncate">{d.title}</div>
                        {!!d.description && <div className="text-xs text-white/60 truncate mt-0.5">{d.description}</div>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {isEditMode && (
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              title="Dashboard Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onToggleEditMode}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title={isEditMode ? "Exit edit mode" : "Enter edit mode"}
          >
            {isEditMode ? <Check className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

