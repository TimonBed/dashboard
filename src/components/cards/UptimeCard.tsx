import React, { useState, useEffect, useRef, useCallback } from "react";
import { Check, X, Clock, Activity, BarChart3 } from "lucide-react";
import { Card } from "./Card";
import { useHomeAssistantStore } from "../../store/useHomeAssistantStore";
import { CardComponentProps } from "../../types/cardProps";
import { HistoryService } from "../../services/historyService";
import { useSettingsStore } from "../../store/useSettingsStore";

interface UptimeCardSpecificProps {
  title: string;
  width?: string;
  height?: string;
  uptimeSettings?: {
    segmentDuration: "minutes" | "hours" | "days";
    segmentCount: number;
  };
}

export type UptimeCardProps = CardComponentProps<UptimeCardSpecificProps>;

export const UptimeCard: React.FC<UptimeCardProps> = ({
  title,
  entityId,
  onTitleChange,
  onJsonSave,
  onCardDelete,
  cardConfig,
  className = "",
  width = "w-full",
  uptimeSettings = { segmentDuration: "hours", segmentCount: 6 },
}) => {
  const { entities } = useHomeAssistantStore();
  const { homeAssistantIP, homeAssistantToken, getHomeAssistantURL } = useSettingsStore();
  const haEntity = entityId ? entities.get(entityId) : undefined;
  const [segmentStatus, setSegmentStatus] = useState<("online" | "offline" | "mixed")[]>(new Array(uptimeSettings.segmentCount).fill("offline"));
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyStates, setHistoryStates] = useState<any[]>([]);
  const historyStatesRef = useRef<any[]>([]);
  const lastEntityStateRef = useRef<string | undefined>(undefined);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // Get status information
  const isOnline = haEntity?.state === "on" || haEntity?.state === "online" || haEntity?.state === "up" || haEntity?.state === "connected";
  const isUnavailable = !haEntity || haEntity.state === "unavailable";

  // Calculate uptime based on number of segments
  const calculateUptime = (historyStates: any[], segmentCount: number): ("online" | "offline" | "mixed")[] => {
    const now = new Date();
    const segments: ("online" | "offline" | "mixed")[] = new Array(segmentCount).fill("offline");

    console.log(`=== Last ${segmentCount} Hours Calculation ===`);
    console.log("Current time:", now.toISOString());

    // Process each segment (each represents 1 hour)
    for (let i = 0; i < segmentCount; i++) {
      // Calculate hour boundaries (each hour is 60 minutes)
      const hourStart = new Date(now.getTime() - (segmentCount - i) * 60 * 60 * 1000);
      const hourEnd = new Date(now.getTime() - (segmentCount - 1 - i) * 60 * 60 * 1000);

      console.log(`\nHour ${i + 1} (${segmentCount - i} hours ago):`);
      console.log(`  Start: ${hourStart.toISOString()}`);
      console.log(`  End: ${hourEnd.toISOString()}`);

      // Find state changes within this hour
      const hourStates = historyStates.filter((state) => {
        const stateTime = new Date(state.last_changed);
        return stateTime >= hourStart && stateTime < hourEnd;
      });

      console.log(`  States found: ${hourStates.length}`);
      if (hourStates.length > 0) {
        console.log(
          `  States:`,
          hourStates.map((s) => ({ state: s.state, time: s.last_changed }))
        );
      }

      if (hourStates.length === 0) {
        // No data for this hour - use the last known state from previous hours
        if (i > 0) {
          segments[i] = segments[i - 1];
          console.log(`  Result: Using previous hour state (${segments[i] ? "ONLINE" : "OFFLINE"})`);
        } else {
          // If this is the first hour and no data, check if there's any state before this hour
          const statesBeforeThisHour = historyStates.filter((state) => {
            const stateTime = new Date(state.last_changed);
            return stateTime < hourStart;
          });

          if (statesBeforeThisHour.length > 0) {
            const lastStateBefore = statesBeforeThisHour[statesBeforeThisHour.length - 1];
            const isLastStateOnline =
              lastStateBefore.state === "on" || lastStateBefore.state === "online" || lastStateBefore.state === "up" || lastStateBefore.state === "connected";
            segments[i] = isLastStateOnline ? "online" : "offline";
            console.log(`  Result: Using last known state before this hour (${isLastStateOnline ? "ONLINE" : "OFFLINE"})`);
          } else {
            segments[i] = "offline"; // Default to offline if no data at all
            console.log(`  Result: No data available, defaulting to OFFLINE`);
          }
        }
        continue;
      }

      // Determine hour status: online, offline, or mixed
      let hasOnline = false;
      let hasOffline = false;
      let onlineTime = 0;
      let totalTime = 0;

      for (let j = 0; j < hourStates.length; j++) {
        const currentState = hourStates[j];
        const nextState = hourStates[j + 1];

        const stateStart = new Date(currentState.last_changed);
        const stateEnd = nextState ? new Date(nextState.last_changed) : hourEnd;

        const stateDuration = stateEnd.getTime() - stateStart.getTime();
        totalTime += stateDuration;

        // Check if this state represents "online"
        const isStateOnline =
          currentState.state === "on" || currentState.state === "online" || currentState.state === "up" || currentState.state === "connected";

        if (isStateOnline) {
          onlineTime += stateDuration;
          hasOnline = true;
        } else {
          hasOffline = true;
        }
      }

      // Determine hour status based on what states were present
      if (totalTime > 0) {
        const onlinePercentage = onlineTime / totalTime;
        let hourStatus: "online" | "offline" | "mixed";

        if (hasOnline && hasOffline) {
          hourStatus = "mixed"; // Orange - both online and offline states
        } else if (hasOnline && !hasOffline) {
          hourStatus = "online"; // Green - only online states
        } else {
          hourStatus = "offline"; // Red - only offline states
        }

        segments[i] = hourStatus;
        console.log(`  Online time: ${Math.round(onlineTime / 1000 / 60)} minutes`);
        console.log(`  Total time: ${Math.round(totalTime / 1000 / 60)} minutes`);
        console.log(`  Online percentage: ${Math.round(onlinePercentage * 100)}%`);
        console.log(`  Has online: ${hasOnline}, Has offline: ${hasOffline}`);
        console.log(`  Result: ${hourStatus.toUpperCase()}`);
      } else {
        segments[i] = "offline";
        console.log(`  Result: No time data, defaulting to OFFLINE`);
      }
    }

    console.log(`\n=== Final ${segmentCount}-Hour Array ===`);
    console.log("Array:", segments);
    console.log(
      "Array with labels:",
      segments.map((status, index) => ({
        hour: `${segmentCount - index} hours ago`,
        status: status.toUpperCase(),
      }))
    );

    return segments;
  };

  // Load initial history data once
  useEffect(() => {
    const loadInitialHistory = async () => {
      if (!entityId || !homeAssistantIP || !homeAssistantToken) {
        setSegmentStatus(new Array(uptimeSettings.segmentCount).fill("offline"));
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const baseUrl = getHomeAssistantURL();
        if (!baseUrl) {
          throw new Error("Invalid Home Assistant URL");
        }

        const historyService = new HistoryService(baseUrl, homeAssistantToken);

        // Calculate how many hours to look back based on segment settings
        let hoursToLookBack: number;
        switch (uptimeSettings.segmentDuration) {
          case "minutes":
            hoursToLookBack = (uptimeSettings.segmentCount * 10) / 60; // Convert minutes to hours
            break;
          case "hours":
            hoursToLookBack = uptimeSettings.segmentCount;
            break;
          case "days":
            hoursToLookBack = uptimeSettings.segmentCount * 24;
            break;
          default:
            hoursToLookBack = uptimeSettings.segmentCount;
        }

        const initialHistory = await historyService.getStateChanges(entityId, hoursToLookBack);
        setHistoryStates(initialHistory);
        historyStatesRef.current = initialHistory;

        if (initialHistory.length === 0) {
          setSegmentStatus(new Array(uptimeSettings.segmentCount).fill("offline"));
          return;
        }

        // Calculate uptime status based on segment count
        const segments = calculateUptime(initialHistory, uptimeSettings.segmentCount);
        setSegmentStatus(segments);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load uptime data");
        setSegmentStatus(new Array(uptimeSettings.segmentCount).fill("offline"));
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialHistory();
  }, [entityId, homeAssistantIP, homeAssistantToken, getHomeAssistantURL]);

  // Add WebSocket state changes to history and recalculate
  const addWebSocketStateChange = useCallback(() => {
    const currentHistory = historyStatesRef.current;
    if (currentHistory.length === 0) return;

    // Only add if state has actually changed
    if (lastEntityStateRef.current !== haEntity?.state) {
      lastEntityStateRef.current = haEntity?.state;

      const now = new Date();
      const lastState = currentHistory[currentHistory.length - 1];

      // Add new state if it's different or enough time has passed (5 second tolerance)
      if (!lastState || lastState.state !== haEntity?.state || Math.abs(new Date(lastState.last_changed).getTime() - now.getTime()) > 5000) {
        const newState = {
          last_changed: now.toISOString(),
          last_updated: now.toISOString(),
          state: haEntity?.state || "unavailable",
          attributes: haEntity?.attributes || {},
        };

        // Add new state to history
        const updatedHistory = [...currentHistory, newState];
        historyStatesRef.current = updatedHistory;
        setHistoryStates(updatedHistory);

        // Recalculate segments with updated history
        const segments = calculateUptime(updatedHistory, uptimeSettings.segmentCount);
        setSegmentStatus(segments);
        setLastUpdateTime(now);

        console.log("🔄 WebSocket state change added:", {
          entityId,
          newState: {
            state: newState.state,
            time: newState.last_changed,
          },
          totalStates: updatedHistory.length,
          newSegments: segments,
          uptimePercentage: Math.round((segments.filter((s) => s).length / segments.length) * 100) + "%",
        });
      }
    }
  }, [haEntity?.state, haEntity?.attributes, uptimeSettings.segmentCount]);

  // Listen for WebSocket state changes
  useEffect(() => {
    if (!entityId || historyStatesRef.current.length === 0) return;

    addWebSocketStateChange();
  }, [haEntity?.state, entityId, addWebSocketStateChange]);

  // Periodic cleanup of old history data
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const currentHistory = historyStatesRef.current;
      if (currentHistory.length === 0) return;

      const now = new Date();
      const cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Keep last 24 hours

      const filteredHistory = currentHistory.filter((state) => new Date(state.last_changed) > cutoffTime);

      if (filteredHistory.length !== currentHistory.length) {
        historyStatesRef.current = filteredHistory;
        setHistoryStates(filteredHistory);
        const segments = calculateUptime(filteredHistory, uptimeSettings.segmentCount);
        setSegmentStatus(segments);
        console.log("Cleaned up old history data, new segments:", segments);
      }
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(cleanupInterval);
  }, [uptimeSettings.segmentCount]);

  // Get uptime percentage (0-100)
  const getUptimePercentage = () => {
    if (isUnavailable) return 0;
    if (!isOnline) return 0;

    // Calculate percentage based on segment status (only count online segments, not mixed)
    const onlineSegments = segmentStatus.filter((status) => status === "online").length;
    return Math.round((onlineSegments / segmentStatus.length) * 100);
  };

  const uptimePercentage = getUptimePercentage();

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
        subtitle={
          isLoading
            ? "Loading..."
            : error
            ? "Error loading data"
            : `${getStatusText()} • ${uptimePercentage}%${lastUpdateTime ? ` • Updated ${lastUpdateTime.toLocaleTimeString()}` : ""}`
        }
        icon={isLoading ? <Clock className="w-5 h-5 text-blue-500" /> : getStatusIcon()}
        onTitleChange={onTitleChange}
        onJsonSave={onJsonSave}
        onCardDelete={onCardDelete}
        cardConfig={cardConfig}
        entityId={entityId}
        onClick={handleCardClick}
        className={`bg-gradient-to-br from-gray-900/90 to-gray-800/90 cursor-pointer ${className}`}
        width={width}
        height="h-16"
      >
        {/* Uptime segments bar in subtitle area */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/30">
          <div className="flex w-full h-full gap-1">
            {Array.from({ length: uptimeSettings.segmentCount }).map((_, index) => {
              const currentSegmentStatus = segmentStatus[index];
              let segmentColor: string;
              let tooltipText: string;

              if (currentSegmentStatus === "online") {
                // Online - green
                segmentColor = "bg-gradient-to-r from-green-500 to-green-500";
                tooltipText = `Segment ${index + 1}: Online`;
              } else if (currentSegmentStatus === "mixed") {
                // Mixed - orange
                segmentColor = "bg-gradient-to-r from-orange-500 to-orange-500";
                tooltipText = `Segment ${index + 1}: Mixed (Online + Offline)`;
              } else {
                // Offline - red
                segmentColor = "bg-gradient-to-r from-red-500 to-red-500";
                tooltipText = `Segment ${index + 1}: Downtime`;
              }

              return <div key={index} className={`h-full flex-1 rounded transition-all duration-1000 ${segmentColor}`} title={tooltipText} />;
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
                <div>
                  <h2 className="text-xl font-bold text-white">{title} - Uptime History</h2>
                  {lastUpdateTime && <p className="text-sm text-gray-400">Last updated: {lastUpdateTime.toLocaleTimeString()}</p>}
                </div>
              </div>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{isLoading ? "..." : error ? "?" : `${uptimePercentage}%`}</div>
                <div className="text-sm text-gray-400">Uptime</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{isLoading ? "..." : segmentStatus.length}</div>
                <div className="text-sm text-gray-400">Data Points</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-400">
                  {isLoading ? "..." : segmentStatus.filter((status) => status === "offline" || status === "mixed").length}
                </div>
                <div className="text-sm text-gray-400">Downtime Events</div>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <X className="w-5 h-5 text-red-400" />
                  <div>
                    <div className="font-medium text-red-400">Error Loading Data</div>
                    <div className="text-sm text-red-300">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400 animate-spin" />
                  <div className="font-medium text-blue-400">Loading uptime data...</div>
                </div>
              </div>
            )}

            {/* Detailed History Chart */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
              <div className="space-y-3">
                {Array.from({ length: uptimeSettings.segmentCount }).map((_, index) => {
                  const currentSegmentStatus = segmentStatus[index];
                  const segmentNumber = index + 1;

                  // Calculate time ago - each segment represents 1 hour
                  const timeAgo = (uptimeSettings.segmentCount - 1 - index) * 60; // 1 hour per segment

                  let statusText: string;
                  let statusColor: string;
                  let statusIcon: React.ReactNode;

                  if (currentSegmentStatus === "online") {
                    statusText = "Online";
                    statusColor = "text-green-400";
                    statusIcon = <Check className="w-4 h-4" />;
                  } else if (currentSegmentStatus === "mixed") {
                    statusText = "Mixed";
                    statusColor = "text-orange-400";
                    statusIcon = <Activity className="w-4 h-4" />;
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
                            currentSegmentStatus === "online" ? "bg-green-500/20" : currentSegmentStatus === "mixed" ? "bg-orange-500/20" : "bg-red-500/20"
                          }`}
                        >
                          {statusIcon}
                        </div>
                        <div>
                          <div className="font-medium text-white">Hour {segmentNumber}</div>
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
