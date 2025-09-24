import { Dashboard } from "../types/dashboard";

// Import dashboard JSON files
import mainDashboard from "../data/dashboards/main-dashboard.json";
import tabletDashboard from "../data/dashboards/tablet-dashboard.json";
import securityDashboard from "../data/dashboards/security-dashboard.json";

class DashboardService {
  private dashboards: Dashboard[] = [];

  constructor() {
    this.loadDashboards();
  }

  private loadDashboards() {
    // Load all dashboard JSON files
    this.dashboards = [mainDashboard as Dashboard, tabletDashboard as Dashboard, securityDashboard as Dashboard];
  }

  public getAllDashboards(): Dashboard[] {
    return this.dashboards;
  }

  public getDashboardById(id: string): Dashboard | undefined {
    return this.dashboards.find((dashboard) => dashboard.id === id);
  }

  public getDashboardByPath(path: string): Dashboard | undefined {
    return this.dashboards.find((dashboard) => dashboard.path === path);
  }

  public addDashboard(dashboard: Dashboard): void {
    this.dashboards.push(dashboard);
  }

  public updateDashboard(id: string, updatedDashboard: Dashboard): void {
    const index = this.dashboards.findIndex((dashboard) => dashboard.id === id);
    if (index !== -1) {
      this.dashboards[index] = updatedDashboard;
    }
  }

  public deleteDashboard(id: string): void {
    this.dashboards = this.dashboards.filter((dashboard) => dashboard.id !== id);
  }
}

export const dashboardService = new DashboardService();
