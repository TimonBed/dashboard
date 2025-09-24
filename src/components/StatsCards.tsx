import React from "react";
import { useHomeAssistantStore } from "../store/useHomeAssistantStore";
import { Activity, Thermometer, Droplets, Zap } from "lucide-react";

export const StatsCards: React.FC = () => {
  const { sensors, isConnected } = useHomeAssistantStore();

  const stats = React.useMemo(() => {
    const totalSensors = sensors.length;
    const onlineSensors = sensors.filter((s) => s.state !== "unavailable" && s.state !== "unknown").length;
    const temperatureSensors = sensors.filter((s) => s.entity_id.includes("temperature") || s.attributes.device_class === "temperature").length;
    const binarySensors = sensors.filter((s) => s.entity_id.startsWith("binary_sensor.")).length;

    return {
      total: totalSensors,
      online: onlineSensors,
      temperature: temperatureSensors,
      binary: binarySensors,
    };
  }, [sensors]);

  const statCards = [
    {
      title: "Total Sensors",
      value: stats.total,
      icon: <Activity className="w-5 h-5" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      title: "Online",
      value: stats.online,
      icon: <Zap className="w-5 h-5" />,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      title: "Temperature",
      value: stats.temperature,
      icon: <Thermometer className="w-5 h-5" />,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
    {
      title: "Binary Sensors",
      value: stats.binary,
      icon: <Droplets className="w-5 h-5" />,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
  ];

  if (!isConnected) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat, index) => (
        <div key={index} className={`card ${stat.bgColor} ${stat.borderColor} border-2`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
            <div className={`${stat.color} ${stat.bgColor} p-2 rounded-lg`}>{stat.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
