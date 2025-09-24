import React from "react";
import { Bed, Droplets, Thermometer, FileText } from "lucide-react";
import { useHomeAssistantStore } from "../store/useHomeAssistantStore";

export interface Badge {
  id: string;
  title: string;
  icon: string;
  entityId: string;
}

export interface RoomHeaderProps {
  roomName: string;
  roomIcon?: string;
  badges?: Badge[];
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({ roomName, roomIcon = "bed", badges = [] }) => {
  const { entities } = useHomeAssistantStore();

  // Icon mapping
  const getIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      bed: <Bed className="w-5 h-5" />,
      droplets: <Droplets className="w-5 h-5" />,
      thermometer: <Thermometer className="w-5 h-5" />,
      lightbulb: <FileText className="w-5 h-5" />,
    };
    return iconMap[iconName] || <Bed className="w-5 h-5" />;
  };

  // Get sensor value and unit
  const getSensorData = (entityId: string) => {
    const entity = entities.get(entityId);
    if (!entity) return { value: "N/A", unit: "" };

    const state = entity.state;
    const attributes = entity.attributes || {};
    const unit = attributes.unit_of_measurement || "";

    // Format the value based on the sensor type
    if (entityId.includes("temperature") || entityId.includes("temp")) {
      return { value: `${parseFloat(state).toFixed(1)}`, unit: "°C" };
    }
    if (entityId.includes("humidity")) {
      return { value: `${parseFloat(state).toFixed(1)}`, unit: "%" };
    }
    if (entityId.includes("light") || entityId.includes("brightness")) {
      return { value: state === "on" ? "1" : "0", unit: "" };
    }

    return { value: state, unit };
  };

  return (
    <div className="flex items-center justify-between w-full px-4 py-3 bg-gray-800/50 rounded-lg mb-4">
      {/* Left side - Room info */}
      <div className="flex items-center space-x-3">
        {getIcon(roomIcon)}
        <span className="text-white font-medium text-lg">{roomName}</span>
      </div>

      {/* Right side - Sensor data */}
      {badges.length > 0 && (
        <div className="flex items-center space-x-4">
          {badges.map((badge) => {
            const sensorData = getSensorData(badge.entityId);
            return (
              <div key={badge.id} className="flex items-center space-x-1 text-gray-300">
                {getIcon(badge.icon)}
                <span className="text-sm">
                  {sensorData.value}
                  {sensorData.unit && <span className="text-xs ml-0.5">{sensorData.unit}</span>}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
