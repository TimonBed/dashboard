import React, { useState, useEffect } from "react";
import { Shield, Check, X, Clock, Activity, BarChart3 } from "lucide-react";
import { Card } from "./Card";
import { useHomeAssistantStore } from "../../store/useHomeAssistantStore";

export interface UptimeCardProps {
  title: string;
  entityId: string;
  onTitleChange?: (newTitle: string) => void;
  className?: string;
  width?: string;
  height?: string;
  uptimeSettings?: {
    segmentDuration: "minutes" | "hours" | "days";
    segmentCount: number;
  };
}

export const UptimeCard: React.FC<UptimeCardProps> = ({
  title,
  entityId,
  onTitleChange,
  className = "",
  width = "w-full",
  height = "h-16",
  uptimeSettings = { segmentDuration: "hours", segmentCount: 6 },
}) => {
  const { entities } = useHomeAssistantStore();
  const haEntity = entities.get(entityId);
  const [segmentStatus, setSegmentStatus] = useState<(boolean | null)[]>(new Array(uptimeSettings.segmentCount).fill(true));
  const [showHistory, setShowHistory] = useState(false);

  // Get status information
  const isOnline = haEntity?.state === "on" || haEntity?.state === "online" || haEntity?.state === "up";
  const isUnavailable = !haEntity || haEntity.state === "unavailable";

  // Simulate uptime data based on segment duration (in real implementation, this would come from HA history)
  useEffect(() => {
    const simulateUptimeData = () => {
      const now = new Date();
      const segments = Array.from({ length: uptimeSettings.segmentCount }, (_, i) => {
        let timeBack: number;
        let downtimeChance: number;

        switch (uptimeSettings.segmentDuration) {
          case "minutes":
            timeBack = (uptimeSettings.segmentCount - 1 - i) * 10; // 10 minutes per segment
            downtimeChance = 0.05; // 5% chance of downtime per 10-minute segment
            break;
          case "hours":
            timeBack = (uptimeSettings.segmentCount - 1 - i) * 60; // 1 hour per segment
            const hour = new Date(now.getTime() - timeBack * 60 * 1000).getHours();
            downtimeChance = hour >= 2 && hour <= 6 ? 0.3 : 0.1; // Higher chance during night
            break;
          case "days":
            timeBack = (uptimeSettings.segmentCount - 1 - i) * 24 * 60; // 1 day per segment
            downtimeChance = 0.02; // 2% chance of downtime per day
            break;
          default:
            timeBack = (uptimeSettings.segmentCount - 1 - i) * 60;
            downtimeChance = 0.1;
        }

        // Check if we have enough history for this segment
        const segmentTime = new Date(now.getTime() - timeBack * 60 * 1000);
        const hasHistory = segmentTime <= now; // In real implementation, check if data exists

        return hasHistory ? Math.random() > downtimeChance : null; // null means no data yet
      });
      setSegmentStatus(segments);
    };

    simulateUptimeData();

    // Update based on segment duration
    const updateInterval =
      uptimeSettings.segmentDuration === "minutes"
        ? 10 * 60 * 1000 // 10 minutes
        : uptimeSettings.segmentDuration === "hours"
        ? 60 * 60 * 1000 // 1 hour
        : 24 * 60 * 60 * 1000; // 1 day

    const interval = setInterval(simulateUptimeData, updateInterval);
    return () => clearInterval(interval);
  }, [uptimeSettings]);

  // Get uptime percentage (0-100)
  const getUptimePercentage = () => {
    if (isUnavailable) return 0;
    if (!isOnline) return 0;

    // Calculate percentage based on segment status (only count segments with data)
    const segmentsWithData = segmentStatus.filter((status) => status !== null);
    if (segmentsWithData.length === 0) return 0;

    const onlineSegments = segmentsWithData.filter((status) => status === true).length;
    return Math.round((onlineSegments / segmentsWithData.length) * 100);
  };

  const uptimePercentage = getUptimePercentage();
  const filledSegments = segmentStatus.filter((status) => status === true).length; // Count of online segments

  // Get status color
  const getStatusColor = () => {
    if (isUnavailable) return "text-red-400";
    if (!isOnline) return "text-red-400";
    if (uptimePercentage >= 99) return "text-green-400";
    if (uptimePercentage >= 95) return "text-yellow-400";
    return "text-orange-400";
  };

  // Get status text
  const getStatusText = () => {
    if (isUnavailable) return "Offline";
    if (!isOnline) return "Offline";
    if (uptimePercentage >= 99) return "Excellent";
    if (uptimePercentage >= 95) return "Good";
    return "Degraded";
  };

  // Get status icon
  const getStatusIcon = () => {
    if (isUnavailable) return <X className="w-5 h-5 text-red-500" />;
    if (!isOnline) return <X className="w-5 h-5 text-red-500" />;
    if (uptimePercentage >= 99) return <Check className="w-5 h-5 text-green-500" />;
    if (uptimePercentage >= 95) return <Activity className="w-5 h-5" />;
    return <Activity className="w-5 h-5 text-yellow-500" />;
  };

  const handleCardClick = () => {
    setShowHistory(true);
  };

  return (
    <>
      <Card
        title={title}
        subtitle={`${getStatusText()} • ${uptimePercentage}%`}
        icon={getStatusIcon()}
        onTitleChange={onTitleChange}
        onClick={handleCardClick}
        className={`bg-gradient-to-br from-gray-900/90 to-gray-800/90 cursor-pointer ${className}`}
        width={width}
        height="h-20"
      >
        {/* Uptime segments bar in subtitle area */}
        <div className="absolute bottom-2 left-2 right-2">
          <div className="flex w-full gap-1">
            {Array.from({ length: uptimeSettings.segmentCount }).map((_, index) => {
              const currentSegmentStatus = segmentStatus[index];
              let segmentColor: string;
              let tooltipText: string;

              if (currentSegmentStatus === null) {
                // No data yet - gray
                segmentColor = "bg-gray-600";
                tooltipText = `Segment ${index + 1}: No data yet`;
              } else if (currentSegmentStatus === true) {
                // Online - status color
                segmentColor = getStatusColor().replace("text-", "bg-").replace("-400", "-500");
                tooltipText = `Segment ${index + 1}: Online`;
              } else {
                // Offline - red
                segmentColor = "bg-red-500";
                tooltipText = `Segment ${index + 1}: Downtime`;
              }

              return <div key={index} className={`h-2 flex-1 rounded transition-colors duration-300 ${segmentColor}`} title={tooltipText} />;
            })}
          </div>
        </div>
      </Card>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowHistory(false)}>
          <div className="bg-gray-900 rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">{title} - Uptime History</h2>
              </div>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{uptimePercentage}%</div>
                <div className="text-sm text-gray-400">Uptime</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{segmentStatus.filter((status) => status !== null).length}</div>
                <div className="text-sm text-gray-400">Data Points</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-400">{segmentStatus.filter((status) => status === false).length}</div>
                <div className="text-sm text-gray-400">Downtime Events</div>
              </div>
            </div>

            {/* Detailed History Chart */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
              <div className="space-y-3">
                {Array.from({ length: uptimeSettings.segmentCount }).map((_, index) => {
                  const currentSegmentStatus = segmentStatus[index];
                  const segmentNumber = index + 1;
                  const timeAgo =
                    (uptimeSettings.segmentCount - 1 - index) *
                    (uptimeSettings.segmentDuration === "minutes" ? 10 : uptimeSettings.segmentDuration === "hours" ? 60 : 24 * 60);

                  let statusText: string;
                  let statusColor: string;
                  let statusIcon: React.ReactNode;

                  if (currentSegmentStatus === null) {
                    statusText = "No Data";
                    statusColor = "text-gray-400";
                    statusIcon = <Clock className="w-4 h-4" />;
                  } else if (currentSegmentStatus === true) {
                    statusText = "Online";
                    statusColor = "text-green-400";
                    statusIcon = <Check className="w-4 h-4" />;
                  } else {
                    statusText = "Downtime";
                    statusColor = "text-red-400";
                    statusIcon = <X className="w-4 h-4" />;
                  }

                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            currentSegmentStatus === null ? "bg-gray-600" : currentSegmentStatus ? "bg-green-500/20" : "bg-red-500/20"
                          }`}
                        >
                          {statusIcon}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {uptimeSettings.segmentDuration === "minutes"
                              ? `Segment ${segmentNumber}`
                              : uptimeSettings.segmentDuration === "hours"
                              ? `Hour ${segmentNumber}`
                              : `Day ${segmentNumber}`}
                          </div>
                          <div className="text-sm text-gray-400">
                            {timeAgo < 60
                              ? `${timeAgo} min ago`
                              : timeAgo < 1440
                              ? `${Math.round(timeAgo / 60)} hours ago`
                              : `${Math.round(timeAgo / 1440)} days ago`}
                          </div>
                        </div>
                      </div>
                      <div className={`font-semibold ${statusColor}`}>{statusText}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Status */}
            <div className="mt-6 p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon()}
                  <div>
                    <div className="font-semibold text-white">Current Status</div>
                    <div className="text-sm text-gray-400">{isUnavailable ? "Unavailable" : isOnline ? "Online" : "Offline"}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{uptimePercentage}%</div>
                  <div className="text-sm text-gray-400">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
