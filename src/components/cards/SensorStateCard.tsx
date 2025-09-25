import React, { memo, useMemo, useCallback } from "react";
import { Card } from "./Card";
import { useHomeAssistantStore } from "../../store/useHomeAssistantStore";
import { Activity, Thermometer, Droplets, Gauge, Zap, Wifi, DoorOpen, DoorClosed } from "lucide-react";
import { useCurrentTime } from "../../hooks/useCurrentTime";

interface SensorStateCardProps {
  title: string;
  entityId?: string;
  onTitleChange?: (title: string, entityId?: string) => void;
}

const SensorStateCardComponent: React.FC<SensorStateCardProps> = ({ title, entityId, onTitleChange }) => {
  const { entities } = useHomeAssistantStore();
  const haEntity = entityId ? entities.get(entityId) : null;
  const currentTime = useCurrentTime(30000); // Update every 30 seconds

  // Error boundary for entity data
  if (entityId && !haEntity) {
    console.warn(`SensorStateCard: Entity ${entityId} not found in Home Assistant data`);
  }

  // Get sensor icon based on entity type or attributes - memoized
  const sensorIcon = useMemo(() => {
    if (!haEntity) return Activity;

    const entityId = haEntity.entity_id.toLowerCase();
    const deviceClass = haEntity.attributes.device_class;
    const state = haEntity.state;

    // Door sensors - return open/closed based on state
    if (deviceClass === "door" || entityId.includes("door")) {
      return state === "on" ? DoorOpen : DoorClosed;
    }

    // Window sensors - also use door icons
    if (deviceClass === "window" || entityId.includes("window")) {
      return state === "on" ? DoorOpen : DoorClosed;
    }

    // Temperature sensors
    if (deviceClass === "temperature" || entityId.includes("temperature") || entityId.includes("temp")) {
      return Thermometer;
    }

    // Humidity sensors
    if (deviceClass === "humidity" || entityId.includes("humidity") || entityId.includes("moisture")) {
      return Droplets;
    }

    // Pressure sensors
    if (deviceClass === "pressure" || entityId.includes("pressure")) {
      return Gauge;
    }

    // Power/energy sensors
    if (deviceClass === "power" || deviceClass === "energy" || entityId.includes("power") || entityId.includes("energy")) {
      return Zap;
    }

    // Connectivity sensors
    if (deviceClass === "connectivity" || entityId.includes("connectivity") || entityId.includes("signal")) {
      return Wifi;
    }

    // Default to activity icon
    return Activity;
  }, [haEntity]);

  // Get icon color based on sensor type and state
  const getIconColor = () => {
    if (!haEntity) return "text-gray-400";

    const deviceClass = haEntity.attributes.device_class;
    const state = haEntity.state;
    const entityId = haEntity.entity_id.toLowerCase();

    // Door/Window sensors - bright green for closed, bright red for open
    if (deviceClass === "door" || deviceClass === "window" || entityId.includes("door") || entityId.includes("window")) {
      return state === "on" ? "text-red-500" : "text-green-500";
    }

    // Temperature sensors
    if (deviceClass === "temperature") {
      const temp = parseFloat(state);
      if (isNaN(temp)) return "text-gray-400";
      if (temp < 0) return "text-blue-500";
      if (temp > 30) return "text-red-500";
      return "text-orange-500";
    }

    // Humidity sensors
    if (deviceClass === "humidity") {
      const humidity = parseFloat(state);
      if (isNaN(humidity)) return "text-gray-400";
      if (humidity < 30) return "text-red-500";
      if (humidity > 70) return "text-blue-500";
      return "text-green-500";
    }

    // Binary sensors (connectivity, motion, etc.)
    if (deviceClass === "connectivity" || deviceClass === "motion") {
      return state === "on" ? "text-green-500" : "text-red-500";
    }

    // Default color
    return "text-blue-500";
  };

  // Get sensor status text
  const getStatusText = () => {
    if (!haEntity) return "Disconnected";

    const state = haEntity.state;
    const deviceClass = haEntity.attributes.device_class;

    if (state === "unavailable") return "Unavailable";
    if (state === "unknown") return "Unknown";

    // Binary sensors
    if (deviceClass === "connectivity") {
      return state === "on" ? "Connected" : "Disconnected";
    }
    if (deviceClass === "motion") {
      return state === "on" ? "Motion Detected" : "No Motion";
    }
    if (deviceClass === "door") {
      return state === "on" ? "Open" : "Closed";
    }
    if (deviceClass === "window") {
      return state === "on" ? "Open" : "Closed";
    }

    // Numeric sensors
    if (deviceClass === "temperature") {
      const temp = parseFloat(state);
      if (isNaN(temp)) return "Invalid";
      if (temp < 0) return "Freezing";
      if (temp > 30) return "Hot";
      return "Normal";
    }

    if (deviceClass === "humidity") {
      const humidity = parseFloat(state);
      if (isNaN(humidity)) return "Invalid";
      if (humidity < 30) return "Dry";
      if (humidity > 70) return "Humid";
      return "Comfortable";
    }

    return "Active";
  };

  // Get relative time since last changed - memoized
  const getRelativeTime = useCallback(
    (timestamp: string) => {
      const now = currentTime;
      const lastChanged = new Date(timestamp);
      const diffInSeconds = Math.floor((now.getTime() - lastChanged.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return `${diffInSeconds}s ago`;
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m ago`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h ago`;
      } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d ago`;
      }
    },
    [currentTime]
  );

  // Get subtitle text - memoized
  const subtitle = useMemo(() => {
    if (!haEntity) return "No data";

    const statusText = getStatusText();
    const lastChanged = haEntity.last_changed ? getRelativeTime(haEntity.last_changed) : "Unknown";

    return `${statusText} • ${lastChanged}`;
  }, [haEntity, getRelativeTime]);

  try {
    const IconComponent = sensorIcon;
    const iconColor = getIconColor();

    return (
      <Card
        title={title}
        subtitle={subtitle}
        icon={
          <IconComponent
            className={`w-6 h-6 ${iconColor} drop-shadow-lg`}
            style={{
              filter: `drop-shadow(0 0 8px ${
                iconColor.includes("red")
                  ? "#ef4444"
                  : iconColor.includes("green")
                  ? "#22c55e"
                  : iconColor.includes("blue")
                  ? "#3b82f6"
                  : iconColor.includes("orange")
                  ? "#f97316"
                  : "#6b7280"
              }40)`,
              transform: "scale(1.1)",
            }}
          />
        }
        entityId={entityId}
        onTitleChange={onTitleChange}
        height="h-16"
      />
    );
  } catch (error) {
    console.error("SensorStateCard render error:", error);
    return (
      <Card title={title} icon={<Activity className="w-5 h-5 text-red-400" />} entityId={entityId} onTitleChange={onTitleChange} height="h-16">
        <div className="flex items-center justify-between h-full px-1">
          <div className="flex items-center gap-2">
            <div className="text-red-500 text-xl font-bold">Error</div>
            <div className="w-2 h-2 rounded-full bg-red-500 opacity-60"></div>
          </div>
          <div className="text-xs text-red-400 opacity-70">Failed to load data</div>
        </div>
      </Card>
    );
  }
};

// Memoize the component to prevent unnecessary re-renders
export const SensorStateCard = memo(SensorStateCardComponent);
