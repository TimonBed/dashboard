import { EntityState } from "../types/homeassistant";

export interface HistoryState {
  last_changed: string;
  last_updated: string;
  state: string;
  attributes: Record<string, any>;
}

export interface HistoryResponse {
  entity_id: string;
  states: HistoryState[];
}

export class HistoryService {
  private baseUrl: string;
  private accessToken: string;

  constructor(baseUrl: string, accessToken: string) {
    this.baseUrl = baseUrl;
    this.accessToken = accessToken;
  }

  private async makeRequest(endpoint: string): Promise<any> {
    const url = `${this.baseUrl}/api/history${endpoint}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Get history for a specific entity
   */
  async getEntityHistory(entityId: string, startTime?: Date, endTime?: Date): Promise<HistoryResponse[]> {
    const params = new URLSearchParams();
    params.append("filter_entity_id", entityId);

    if (startTime) {
      params.append("start_time", startTime.toISOString());
    }

    if (endTime) {
      params.append("end_time", endTime.toISOString());
    }

    // Try the correct Home Assistant history API endpoint
    const endpoint = `/period?${params.toString()}`;
    return await this.makeRequest(endpoint);
  }

  /**
   * Get history for multiple entities
   */
  async getMultipleEntityHistory(entityIds: string[], startTime?: Date, endTime?: Date): Promise<HistoryResponse[]> {
    const params = new URLSearchParams();

    entityIds.forEach((id) => {
      params.append("filter_entity_id", id);
    });

    if (startTime) {
      params.append("start_time", startTime.toISOString());
    }

    if (endTime) {
      params.append("end_time", endTime.toISOString());
    }

    const endpoint = `/period?${params.toString()}`;
    return await this.makeRequest(endpoint);
  }

  /**
   * Get state changes for an entity (last 24 hours by default)
   */
  async getStateChanges(entityId: string, hours: number = 24): Promise<HistoryState[]> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

    try {
      const history = await this.getEntityHistory(entityId, startTime, endTime);

      // The history API returns an array of arrays
      // Each inner array contains state changes for one entity
      if (history.length === 0) {
        return await this.getStateChangesAlternative(entityId, startTime, endTime);
      }

      // The response is an array of arrays, where each inner array contains states for one entity
      // We need to find the array that contains states for our entity
      let entityStates: HistoryState[] = [];

      for (const entityArray of history) {
        if (Array.isArray(entityArray) && entityArray.length > 0) {
          // Check if this array contains states for our entity
          const firstState = entityArray[0];
          if (firstState && firstState.entity_id === entityId) {
            entityStates = entityArray;
            break;
          }
        }
      }

      if (entityStates.length === 0) {
        return await this.getStateChangesAlternative(entityId, startTime, endTime);
      }

      return entityStates;
    } catch (error) {
      return await this.getStateChangesAlternative(entityId, startTime, endTime);
    }
  }

  /**
   * Alternative method to get state changes using different API format
   */
  private async getStateChangesAlternative(entityId: string, startTime: Date, endTime: Date): Promise<HistoryState[]> {
    try {
      // Try the logbook API instead
      const params = new URLSearchParams();
      params.append("entity", entityId);
      params.append("start_time", startTime.toISOString());
      params.append("end_time", endTime.toISOString());

      const endpoint = `/logbook?${params.toString()}`;
      const logbookData = await this.makeRequest(endpoint);

      // Convert logbook format to history format
      if (Array.isArray(logbookData)) {
        return logbookData.map((entry) => ({
          last_changed: entry.when,
          last_updated: entry.when,
          state: entry.state,
          attributes: entry.attributes || {},
        }));
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get the last state change for an entity
   */
  async getLastStateChange(entityId: string): Promise<HistoryState | null> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

    const history = await this.getEntityHistory(entityId, startTime, endTime);

    if (history.length === 0 || !history[0].states || history[0].states.length === 0) {
      return null;
    }

    // Return the most recent state
    return history[0].states[history[0].states.length - 1];
  }

  /**
   * Test the API connection and return basic info
   */
  async testConnection(entityId?: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Try to get a simple history request
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 1 * 60 * 60 * 1000); // Last 1 hour

      const params = new URLSearchParams();
      params.append("start_time", startTime.toISOString());
      params.append("end_time", endTime.toISOString());

      // Add entity filter if provided, otherwise get all entities
      if (entityId) {
        params.append("filter_entity_id", entityId);
      }

      const testUrl = `${this.baseUrl}/api/history/period?${params.toString()}`;

      const response = await fetch(testUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          message: `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        message: "API connection successful",
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get available entities from Home Assistant (for debugging)
   */
  async getAvailableEntities(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/states`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      return [];
    }
  }

  /**
   * Test history for a specific entity with detailed debugging
   */
  async testEntityHistory(entityId: string, hours: number = 24): Promise<{ success: boolean; data?: any; error?: string; stateCount?: number }> {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

      const params = new URLSearchParams();
      params.append("filter_entity_id", entityId);
      params.append("start_time", startTime.toISOString());
      params.append("end_time", endTime.toISOString());

      const endpoint = `/period?${params.toString()}`;
      const result = await this.makeRequest(endpoint);

      // Count the actual state changes for this entity
      let stateCount = 0;
      if (Array.isArray(result)) {
        for (const entityArray of result) {
          if (Array.isArray(entityArray) && entityArray.length > 0) {
            const firstState = entityArray[0];
            if (firstState && firstState.entity_id === entityId) {
              stateCount = entityArray.length;
              break;
            }
          }
        }
      }

      return {
        success: true,
        data: result,
        stateCount: stateCount,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
