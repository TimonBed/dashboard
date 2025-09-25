import React, { useState, useEffect, memo } from "react";
import { Activity, Zap, Clock, Database, Wifi } from "lucide-react";
import { getWebSocketStats, resetWebSocketStats } from "../services/websocket";

interface PerformanceStats {
  totalMessages: number;
  messageRate: number;
  averageRenderTime: number;
  slowRenders: number;
  memoryUsage: number;
}

const PerformanceDashboardComponent: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats>({
    totalMessages: 0,
    messageRate: 0,
    averageRenderTime: 0,
    slowRenders: 0,
    memoryUsage: 0,
  });

  useEffect(() => {
    const updateStats = () => {
      const wsStats = getWebSocketStats();
      const memoryInfo = (performance as any).memory;

      setStats({
        totalMessages: wsStats.totalMessages,
        messageRate: wsStats.messageRate,
        averageRenderTime: wsStats.averageInterval,
        slowRenders: wsStats.messageRate < 1 ? 1 : 0, // Consider slow if less than 1 msg/s
        memoryUsage: memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0,
      });
    };

    // Update stats every second
    const interval = setInterval(updateStats, 1000);
    updateStats(); // Initial update

    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      title: "WebSocket Messages",
      value: stats.totalMessages.toLocaleString(),
      icon: <Wifi className="w-5 h-5" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      title: "Message Rate",
      value: `${stats.messageRate.toFixed(1)}/s`,
      icon: <Zap className="w-5 h-5" />,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      title: "Memory Usage",
      value: `${stats.memoryUsage.toFixed(1)}MB`,
      icon: <Database className="w-5 h-5" />,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
    {
      title: "Performance",
      value: stats.messageRate > 10 ? "Good" : "Slow",
      icon: <Activity className="w-5 h-5" />,
      color: stats.messageRate > 10 ? "text-green-600" : "text-red-600",
      bgColor: stats.messageRate > 10 ? "bg-green-50" : "bg-red-50",
      borderColor: stats.messageRate > 10 ? "border-green-200" : "border-red-200",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Performance Monitor</h3>
        <button onClick={() => resetWebSocketStats()} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors">
          Reset
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {statCards.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} ${stat.borderColor} border rounded-lg p-2`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">{stat.title}</p>
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`${stat.color} p-1 rounded`}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-2">
        <h4 className="text-xs font-medium text-gray-700 mb-1">Tips</h4>
        <ul className="text-xs text-gray-600 space-y-0.5">
          <li>• High message rates = active HA communication</li>
          <li>• Memory should stay under 100MB</li>
          <li>• Check browser DevTools for details</li>
        </ul>
      </div>
    </div>
  );
};

export const PerformanceDashboard = memo(PerformanceDashboardComponent);
