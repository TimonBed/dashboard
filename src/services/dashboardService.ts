import { Dashboard } from "../types/dashboard";

// Import dashboard JSON files (used as fallback in development)
import tabletDashboard from "../data/dashboards/tablet-dashboard.json";
import securityDashboard from "../data/dashboards/security-dashboard.json";

class DashboardService {
  private dashboards: Dashboard[] = [];
  private isLoaded: boolean = false;
  private loadPromise: Promise<void> | null = null;

  constructor() {
    // Don't load immediately, wait for async fetch
  }

  private async loadDashboardsFromAPI(): Promise<void> {
    try {
      const response = await fetch("/api/dashboards");
      const result = await response.json();

      if (result.success && result.dashboards) {
        this.dashboards = result.dashboards as Dashboard[];
        console.log("✅ Dashboards loaded from API (production mode)");
        this.isLoaded = true;
        return;
      }
      throw new Error("Failed to load from API");
    } catch (error) {
      // Fallback to static imports (development mode)
      console.log("📦 Using bundled dashboards (development mode)");
      this.dashboards = [tabletDashboard as Dashboard, securityDashboard as Dashboard];
      this.isLoaded = true;
    }
  }

  private ensureLoaded(): Promise<void> {
    if (this.isLoaded) {
      return Promise.resolve();
    }
    if (!this.loadPromise) {
      this.loadPromise = this.loadDashboardsFromAPI();
    }
    return this.loadPromise;
  }

  public async getAllDashboards(): Promise<Dashboard[]> {
    await this.ensureLoaded();
    return this.dashboards;
  }

  public async reloadDashboards(): Promise<void> {
    this.isLoaded = false;
    this.loadPromise = null;
    await this.ensureLoaded();
  }

  public async getDashboardById(id: string): Promise<Dashboard | undefined> {
    await this.ensureLoaded();
    return this.dashboards.find((dashboard) => dashboard.id === id);
  }

  public async getDashboardByPath(path: string): Promise<Dashboard | undefined> {
    await this.ensureLoaded();
    return this.dashboards.find((dashboard) => dashboard.path === path);
  }

  public async addDashboard(dashboard: Dashboard): Promise<void> {
    await this.ensureLoaded();
    this.dashboards.push(dashboard);
    await this.saveDashboardToFile(dashboard.id, dashboard);
  }

  public async updateDashboard(id: string, updatedDashboard: Dashboard): Promise<void> {
    await this.ensureLoaded();
    const index = this.dashboards.findIndex((dashboard) => dashboard.id === id);
    if (index !== -1) {
      this.dashboards[index] = updatedDashboard;
    }
  }

  public async deleteDashboard(id: string): Promise<void> {
    await this.ensureLoaded();

    // Optimistically update in-memory list
    this.dashboards = this.dashboards.filter((dashboard) => dashboard.id !== id);

    // Persist deletion via API (dev middleware or production server)
    try {
      const response = await fetch(`/api/dashboard/${encodeURIComponent(id)}`, { method: "DELETE" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Failed to delete dashboard ${id}`);
      }
      console.log(`🗑️ Dashboard ${id} deleted from file`);
    } catch (error: any) {
      console.warn("API not available for delete; dashboard removed in-memory only:", error?.message || error);
    }
  }

  public async updateCardConfig(dashboardId: string, cardId: string, newConfig: any): Promise<boolean> {
    await this.ensureLoaded();
    const dashboard = await this.getDashboardById(dashboardId);
    if (!dashboard) {
      console.error(`Dashboard ${dashboardId} not found`);
      return false;
    }

    // Search through all columns and their cards
    let cardFound = false;
    for (const column of dashboard.columns || []) {
      const cardIndex = column.cards.findIndex((card: any) => card.id === cardId);
      if (cardIndex !== -1) {
        column.cards[cardIndex] = newConfig;
        cardFound = true;
        break;
      }

      // Also check for nested cards in room-sections
      for (const card of column.cards) {
        if (card.type === "room-section" && card.cards) {
          const nestedCardIndex = card.cards.findIndex((c: any) => c.id === cardId);
          if (nestedCardIndex !== -1) {
            card.cards[nestedCardIndex] = newConfig;
            cardFound = true;
            break;
          }
        }
      }
      if (cardFound) break;
    }

    if (!cardFound) {
      console.error(`Card ${cardId} not found in dashboard ${dashboardId}`);
      return false;
    }

    // Update the dashboard in memory
    this.updateDashboard(dashboardId, dashboard);

    // Save to file
    await this.saveDashboardToFile(dashboardId, dashboard);

    // Reload dashboards from file to ensure UI reflects changes
    await this.reloadDashboards();

    return true;
  }

  public async saveDashboardToFile(dashboardId: string, dashboard: Dashboard): Promise<void> {
    const jsonStr = JSON.stringify(dashboard, null, 2);
    const fileName = `${dashboardId}.json`;

    try {
      // Try to save to file via API (development only)
      const response = await fetch("/api/dashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dashboardId,
          data: dashboard,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log(`%c✅ Dashboard ${dashboardId} saved to file!`, "color: #10b981; font-size: 14px; font-weight: bold;");
        console.log(`%cFile updated: src/data/dashboards/${fileName}`, "color: #3b82f6; font-size: 12px;");
        return;
      } else {
        throw new Error(result.error || "Failed to save dashboard");
      }
    } catch (error: any) {
      // Fallback: Download file if API is not available (production or error)
      console.warn("API not available, downloading file instead:", error.message);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(`%c📝 Dashboard ${dashboardId} updated!`, "color: #10b981; font-size: 14px; font-weight: bold;");
      console.log(`%cFile downloaded: ${fileName}`, "color: #3b82f6; font-size: 12px;");
      console.log(`%cReplace: src/data/dashboards/${fileName}`, "color: #3b82f6; font-size: 12px;");
      console.log("%cUpdated JSON (for manual copy):", "color: #f59e0b; font-weight: bold;");
      console.log(jsonStr);
    }
  }

  public async exportDashboard(dashboardId: string): Promise<void> {
    const dashboard = await this.getDashboardById(dashboardId);
    if (dashboard) {
      await this.saveDashboardToFile(dashboardId, dashboard);
    }
  }
}

export const dashboardService = new DashboardService();
