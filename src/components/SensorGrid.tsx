import React, { useMemo } from "react";
import { SensorCard } from "./SensorCard";
import { useHomeAssistantStore } from "../store/useHomeAssistantStore";
import { SensorEntity } from "../types/homeassistant";

interface SensorCategory {
  name: string;
  icon: string;
  color: string;
  sensors: SensorEntity[];
}

export const SensorGrid: React.FC = () => {
  const sensors = useHomeAssistantStore((state) => state.sensors);

  const categorizedSensors = useMemo(() => {
    const categories: { [key: string]: SensorCategory } = {};

    sensors.forEach((sensor) => {
      const { entity_id, attributes } = sensor;
      const { device_class } = attributes;

      let categoryKey = "other";
      let categoryName = "Other";
      let categoryIcon = "📊";
      let categoryColor = "bg-gray-50 border-gray-200";

      // Determine category based on entity_id and device_class
      if (device_class === "temperature" || entity_id.includes("temperature")) {
        categoryKey = "temperature";
        categoryName = "Temperature";
        categoryIcon = "🌡️";
        categoryColor = "bg-red-50 border-red-200";
      } else if (device_class === "humidity" || entity_id.includes("humidity")) {
        categoryKey = "humidity";
        categoryName = "Humidity";
        categoryIcon = "💧";
        categoryColor = "bg-blue-50 border-blue-200";
      } else if (device_class === "power" || entity_id.includes("power") || entity_id.includes("energy")) {
        categoryKey = "power";
        categoryName = "Power & Energy";
        categoryIcon = "⚡";
        categoryColor = "bg-yellow-50 border-yellow-200";
      } else if (device_class === "connectivity" || entity_id.includes("wifi") || entity_id.includes("connectivity")) {
        categoryKey = "connectivity";
        categoryName = "Connectivity";
        categoryIcon = "📶";
        categoryColor = "bg-green-50 border-green-200";
      } else if (entity_id.includes("battery")) {
        categoryKey = "battery";
        categoryName = "Battery";
        categoryIcon = "🔋";
        categoryColor = "bg-orange-50 border-orange-200";
      } else if (entity_id.includes("person") || entity_id.includes("activity")) {
        categoryKey = "person";
        categoryName = "Person & Activity";
        categoryIcon = "👤";
        categoryColor = "bg-purple-50 border-purple-200";
      } else if (entity_id.includes("weather") || entity_id.includes("sun")) {
        categoryKey = "weather";
        categoryName = "Weather";
        categoryIcon = "☀️";
        categoryColor = "bg-cyan-50 border-cyan-200";
      } else if (entity_id.includes("backup")) {
        categoryKey = "backup";
        categoryName = "Backup";
        categoryIcon = "💾";
        categoryColor = "bg-indigo-50 border-indigo-200";
      } else if (entity_id.includes("pc") || entity_id.includes("computer")) {
        categoryKey = "computer";
        categoryName = "Computer";
        categoryIcon = "💻";
        categoryColor = "bg-slate-50 border-slate-200";
      }

      if (!categories[categoryKey]) {
        categories[categoryKey] = {
          name: categoryName,
          icon: categoryIcon,
          color: categoryColor,
          sensors: [],
        };
      }

      categories[categoryKey].sensors.push(sensor);
    });

    // Sort categories by name
    return Object.values(categories).sort((a, b) => a.name.localeCompare(b.name));
  }, [sensors]);

  if (sensors.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No sensors found</div>
        <div className="text-gray-400 text-sm mt-2">Make sure Home Assistant is running and accessible</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categorizedSensors.map((category) => (
        <div key={category.name} className="space-y-3">
          {/* Category Header */}
          <div className={`${category.color} rounded-lg px-4 py-2 border-2`}>
            <div className="flex items-center space-x-2">
              <span className="text-lg">{category.icon}</span>
              <h3 className="font-semibold text-gray-800">{category.name}</h3>
              <span className="text-sm text-gray-600">({category.sensors.length})</span>
            </div>
          </div>

          {/* Category Sensors */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2">
            {category.sensors.map((sensor) => (
              <SensorCard key={sensor.entity_id} sensor={sensor} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
