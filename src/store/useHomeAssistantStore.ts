import { create } from "zustand";
import { EntityState, SensorEntity } from "../types/homeassistant";

interface HomeAssistantState {
  entities: Map<string, EntityState>;
  sensors: SensorEntity[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  connectionType: "websocket" | "none";
  websocketError: string | null;
}

interface HomeAssistantActions {
  setEntities: (entities: EntityState[]) => void;
  updateEntity: (entity: EntityState) => void;
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastUpdate: (date: Date) => void;
  setConnectionType: (type: "websocket" | "none") => void;
  setWebSocketError: (error: string | null) => void;
  getSensorEntities: () => SensorEntity[];
  getEntityById: (entityId: string) => EntityState | undefined;
}

export const useHomeAssistantStore = create<HomeAssistantState & HomeAssistantActions>((set, get) => ({
  entities: new Map(),
  sensors: [],
  isConnected: false,
  isLoading: false,
  error: null,
  lastUpdate: null,
  connectionType: "none",
  websocketError: null,

  setEntities: (entities) => {
    const entityMap = new Map<string, EntityState>();
    const sensors: SensorEntity[] = [];

    entities.forEach((entity) => {
      entityMap.set(entity.entity_id, entity);

      // Filter for sensor entities
      if (
        entity.entity_id.startsWith("sensor.") ||
        entity.entity_id.startsWith("binary_sensor.") ||
        entity.entity_id.startsWith("device_tracker.") ||
        entity.entity_id.startsWith("weather.") ||
        entity.entity_id.startsWith("sun.") ||
        entity.entity_id.startsWith("person.")
      ) {
        sensors.push(entity as SensorEntity);
      }
    });

    set({
      entities: entityMap,
      sensors: sensors.sort((a, b) => a.attributes.friendly_name?.localeCompare(b.attributes.friendly_name) || 0),
      lastUpdate: new Date(),
    });
  },

  updateEntity: (entity) => {
    const { entities, sensors } = get();
    const newEntities = new Map(entities);
    newEntities.set(entity.entity_id, entity);

    // Update sensors array if it's a sensor entity
    let newSensors = [...sensors];
    const sensorIndex = newSensors.findIndex((s) => s.entity_id === entity.entity_id);

    if (
      entity.entity_id.startsWith("sensor.") ||
      entity.entity_id.startsWith("binary_sensor.") ||
      entity.entity_id.startsWith("device_tracker.") ||
      entity.entity_id.startsWith("weather.") ||
      entity.entity_id.startsWith("sun.") ||
      entity.entity_id.startsWith("person.")
    ) {
      if (sensorIndex >= 0) {
        newSensors[sensorIndex] = entity as SensorEntity;
      } else {
        newSensors.push(entity as SensorEntity);
        newSensors.sort((a, b) => a.attributes.friendly_name?.localeCompare(b.attributes.friendly_name) || 0);
      }
    }

    set({
      entities: newEntities,
      sensors: newSensors,
      lastUpdate: new Date(),
    });
  },

  setConnected: (connected) => set({ isConnected: connected }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setLastUpdate: (date) => set({ lastUpdate: date }),
  setConnectionType: (type) => set({ connectionType: type }),
  setWebSocketError: (error) => set({ websocketError: error }),

  getSensorEntities: () => get().sensors,
  getEntityById: (entityId) => get().entities.get(entityId),
}));
