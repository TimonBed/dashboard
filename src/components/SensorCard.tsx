import React, { useState } from "react";
import { SensorEntity } from "../types/homeassistant";
import { Thermometer, Droplets, Zap, Wifi, WifiOff, Sun, Moon, Cloud, CloudRain, Home, User, Activity, Gauge, History } from "lucide-react";
import { StateHistory } from "./StateHistory";

interface SensorCardProps {
  sensor: SensorEntity;
}

const getSensorIcon = (entityId: string, deviceClass?: string) => {
  if (deviceClass) {
    switch (deviceClass) {
      case "temperature":
        return <Thermometer className="w-3 h-3" />;
      case "humidity":
        return <Droplets className="w-3 h-3" />;
      case "power":
        return <Zap className="w-3 h-3" />;
      case "connectivity":
        return <Wifi className="w-3 h-3" />;
      case "illuminance":
        return <Sun className="w-3 h-3" />;
      case "pressure":
        return <Gauge className="w-3 h-3" />;
      default:
        break;
    }
  }

  if (entityId.includes("temperature")) return <Thermometer className="w-3 h-3" />;
  if (entityId.includes("humidity")) return <Droplets className="w-3 h-3" />;
  if (entityId.includes("power") || entityId.includes("energy")) return <Zap className="w-3 h-3" />;
  if (entityId.includes("wifi") || entityId.includes("connectivity")) return <Wifi className="w-3 h-3" />;
  if (entityId.includes("sun")) return <Sun className="w-3 h-3" />;
  if (entityId.includes("moon")) return <Moon className="w-3 h-3" />;
  if (entityId.includes("weather") || entityId.includes("cloud")) return <Cloud className="w-3 h-3" />;
  if (entityId.includes("rain")) return <CloudRain className="w-3 h-3" />;
  if (entityId.includes("person")) return <User className="w-3 h-3" />;
  if (entityId.includes("home") || entityId.includes("house")) return <Home className="w-3 h-3" />;

  return <Activity className="w-3 h-3" />;
};

const getStatusColor = (state: string, deviceClass?: string) => {
  if (deviceClass === "connectivity" || deviceClass === "door" || deviceClass === "window") {
    return state === "on" || state === "open" ? "text-green-300" : "text-red-300";
  }

  if (state === "unavailable" || state === "unknown") {
    return "text-gray-400";
  }

  if (state === "on") {
    return "text-green-300";
  }

  if (state === "off") {
    return "text-red-300";
  }

  return "text-blue-300";
};

const formatValue = (state: string, unit?: string) => {
  if (state === "unavailable" || state === "unknown") {
    return state;
  }

  if (unit) {
    return `${state} ${unit}`;
  }

  return state;
};

export const SensorCard: React.FC<SensorCardProps> = ({ sensor }) => {
  const { state, attributes } = sensor;
  const { friendly_name, unit_of_measurement, device_class } = attributes;
  const [showHistory, setShowHistory] = useState(false);

  const icon = getSensorIcon(sensor.entity_id, device_class);
  const statusColor = getStatusColor(state, device_class);
  const formattedValue = formatValue(state, unit_of_measurement);

  const handleCardClick = () => {
    setShowHistory(true);
  };

  const getCategoryColor = (entityId: string, deviceClass?: string) => {
    if (deviceClass === "temperature" || entityId.includes("temperature")) return "bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-500/30";
    if (deviceClass === "humidity" || entityId.includes("humidity")) return "bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/30";
    if (deviceClass === "power" || entityId.includes("power") || entityId.includes("energy"))
      return "bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 border-yellow-500/30";
    if (deviceClass === "connectivity" || entityId.includes("wifi") || entityId.includes("connectivity"))
      return "bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/30";
    if (entityId.includes("battery")) return "bg-gradient-to-br from-orange-900/20 to-orange-800/10 border-orange-500/30";
    if (entityId.includes("person") || entityId.includes("activity")) return "bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30";
    if (entityId.includes("weather") || entityId.includes("sun")) return "bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 border-cyan-500/30";
    if (entityId.includes("backup")) return "bg-gradient-to-br from-indigo-900/20 to-indigo-800/10 border-indigo-500/30";
    return "bg-gradient-to-br from-gray-800/40 to-gray-900/20 border-gray-600/30";
  };

  const getCategoryIcon = (entityId: string, deviceClass?: string) => {
    if (deviceClass === "temperature" || entityId.includes("temperature")) return "🌡️";
    if (deviceClass === "humidity" || entityId.includes("humidity")) return "💧";
    if (deviceClass === "power" || entityId.includes("power") || entityId.includes("energy")) return "⚡";
    if (deviceClass === "connectivity" || entityId.includes("wifi") || entityId.includes("connectivity")) return "📶";
    if (entityId.includes("battery")) return "🔋";
    if (entityId.includes("person") || entityId.includes("activity")) return "👤";
    if (entityId.includes("weather") || entityId.includes("sun")) return "☀️";
    if (entityId.includes("backup")) return "💾";
    return "📊";
  };

  const categoryColor = getCategoryColor(sensor.entity_id, device_class);
  const categoryIcon = getCategoryIcon(sensor.entity_id, device_class);

  return (
    <>
      <div
        className={`${categoryColor} rounded-2xl border p-4 cursor-pointer group relative transition-all duration-300 backdrop-blur-sm`}
        onClick={handleCardClick}
        title={`${friendly_name || sensor.entity_id} - ${formattedValue}`}
      >
        {/* Header with category icon and value */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
              <span className="text-lg">{categoryIcon}</span>
            </div>
            <div className="text-white/80">{icon}</div>
          </div>
          <div className={`text-lg font-bold ${statusColor} truncate max-w-[80px]`}>{formattedValue}</div>
        </div>

        {/* Name */}
        <div className="text-sm font-semibold text-white truncate mb-2">{friendly_name || sensor.entity_id.split(".").pop()}</div>

        {/* Entity type and history icon */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-300 truncate max-w-[100px]">{sensor.entity_id.split(".").pop()}</div>
          <History className="w-4 h-4 text-gray-400 opacity-0 transition-opacity" />
        </div>

        {/* Status indicator dot */}
        <div className="absolute top-3 right-3">
          <div
            className={`w-3 h-3 rounded-full shadow-lg ${
              state === "unavailable" || state === "unknown"
                ? "bg-gray-400"
                : state === "on" || state === "open"
                ? "bg-green-400"
                : state === "off" || state === "closed"
                ? "bg-red-400"
                : "bg-blue-400"
            }`}
          />
        </div>

        {/* Hover effect */}
      </div>

      <StateHistory entity={sensor} isOpen={showHistory} onClose={() => setShowHistory(false)} />
    </>
  );
};
