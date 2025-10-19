import React from "react";
import { Timer } from "lucide-react";
import { Card } from "./Card";
import { useHomeAssistantStore } from "../../store/useHomeAssistantStore";
import { CardComponentProps } from "../../types/cardProps";

// Helper: Parse HH:MM:SS duration string
const parseDuration = (durationStr: string): number | null => {
  const parts = durationStr.split(":").map(Number);
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  }
  return null;
};

// Helper: Format time from milliseconds
const formatTime = (ms: number): string => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

// Helper: Get color based on remaining time
const getTimeColor = (ms: number): string => {
  if (ms < 60000) return "text-red-400";
  if (ms < 300000) return "text-orange-400";
  if (ms < 1800000) return "text-yellow-400";
  return "text-green-400";
};

// Helper: Get progress bar color class
const getProgressColor = (percentage: number): string => {
  if (percentage >= 100) return "bg-gradient-to-r from-green-500 to-green-400";
  if (percentage >= 75) return "bg-gradient-to-r from-yellow-500 to-yellow-400";
  if (percentage >= 50) return "bg-gradient-to-r from-orange-500 to-orange-400";
  return "bg-gradient-to-r from-red-500 to-red-400";
};

// Helper: Get circle color
const getCircleColor = (percentage: number): string => {
  if (percentage >= 100) return "text-green-500";
  if (percentage >= 75) return "text-yellow-500";
  if (percentage >= 50) return "text-orange-500";
  return "text-red-500";
};

interface TimeRemainingCardSpecificProps {
  title: string;
  width?: string;
  showIcon?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  remainingTimeEntityId?: string;
}

export type TimeRemainingCardProps = CardComponentProps<TimeRemainingCardSpecificProps>;

export const TimeRemainingCard: React.FC<TimeRemainingCardProps> = ({
  title,
  entityId,
  remainingTimeEntityId,
  onTitleChange,
  onJsonSave,
  onCardDelete,
  cardConfig,
  className = "",
  width = "w-full",
  showIcon = true,
  showTitle = true,
  showSubtitle = true,
}) => {
  const { entities } = useHomeAssistantStore();
  const currentTime = new Date();

  // Cache entity lookups to prevent repeated Map.get() calls
  const haEntity = React.useMemo(() => (entityId ? entities.get(entityId) : undefined), [entityId, entities]);

  const remainingTimeEntity = React.useMemo(() => (remainingTimeEntityId ? entities.get(remainingTimeEntityId) : undefined), [remainingTimeEntityId, entities]);

  const unavailable = React.useMemo(() => {
    if (haEntity?.state === "unavailable") return true;
    if (remainingTimeEntity?.state === "unavailable") return true;
    if (!haEntity && !remainingTimeEntity) return true;
    return false;
  }, [haEntity, remainingTimeEntity]);

  // Calculate remaining time
  const getRemainingTime = () => {
    // If we have a separate remaining time entity, use that
    if (remainingTimeEntity) {
      const state = remainingTimeEntity.state;
      const attributes = remainingTimeEntity.attributes || {};

      // Check if state is minutes remaining (simple number)
      if (state && !isNaN(Number(state))) {
        const minutes = Number(state);
        if (minutes <= 0) return { text: "Completed", color: "text-green-400" };

        const timeText = minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;

        return { text: timeText, color: getTimeColor(minutes * 60 * 1000) };
      }

      // Check for different time-based attributes
      let endTime: Date | null = null;

      // Check for end_time attribute (common for timers)
      if (attributes.end_time) {
        endTime = new Date(attributes.end_time);
      }
      // Check for remaining_time attribute
      else if (attributes.remaining_time) {
        const remaining = attributes.remaining_time;
        if (typeof remaining === "string") {
          const durationMs = parseDuration(remaining);
          if (durationMs) {
            endTime = new Date(currentTime.getTime() + durationMs);
          }
        }
      }
      // Check for duration attribute
      else if (attributes.duration) {
        const duration = attributes.duration;
        if (typeof duration === "string") {
          const durationMs = parseDuration(duration);
          if (durationMs) {
            endTime = new Date(currentTime.getTime() + durationMs);
          }
        }
      }
      // Check if state is a timestamp
      else if (state && !isNaN(Date.parse(state))) {
        endTime = new Date(state);
      }

      if (endTime) {
        const now = currentTime.getTime();
        const end = endTime.getTime();
        const remaining = end - now;

        if (remaining <= 0) return { text: "Completed", color: "text-green-400" };

        return { text: formatTime(remaining), color: getTimeColor(remaining) };
      }
    }

    if (!haEntity) {
      // Example time for debugging - 5 minutes from now
      const exampleEndTime = new Date(currentTime.getTime() + 5 * 60 * 1000);
      const remaining = exampleEndTime.getTime() - currentTime.getTime();

      if (remaining <= 0) return { text: "Completed", color: "text-green-400" };

      return { text: formatTime(remaining), color: getTimeColor(remaining) };
    }

    const state = haEntity.state;
    const attributes = haEntity.attributes || {};

    // Check for different time-based attributes
    let endTime: Date | null = null;

    // Check for end_time attribute (common for timers)
    if (attributes.end_time) {
      endTime = new Date(attributes.end_time);
    }
    // Check for remaining_time attribute
    else if (attributes.remaining_time) {
      const remaining = attributes.remaining_time;
      if (typeof remaining === "string") {
        const durationMs = parseDuration(remaining);
        if (durationMs) {
          endTime = new Date(currentTime.getTime() + durationMs);
        }
      }
    }
    // Check for duration attribute
    else if (attributes.duration) {
      const duration = attributes.duration;
      if (typeof duration === "string") {
        const durationMs = parseDuration(duration);
        if (durationMs) {
          endTime = new Date(currentTime.getTime() + durationMs);
        }
      }
    }
    // Check if state is a timestamp
    else if (state && !isNaN(Date.parse(state))) {
      endTime = new Date(state);
    }

    if (!endTime) return null;

    const now = currentTime.getTime();
    const end = endTime.getTime();
    const remaining = end - now;

    if (remaining <= 0) return { text: "Completed", color: "text-green-400" };

    return { text: formatTime(remaining), color: getTimeColor(remaining) };
  };

  const remaining = getRemainingTime();

  // Get sensor state for title - always use remainingTimeEntityId if provided
  const getSensorState = () => {
    // Always use remainingTimeEntity if remainingTimeEntityId is provided
    if (remainingTimeEntityId) {
      if (remainingTimeEntity) {
        const state = remainingTimeEntity.state;
        if (state && !isNaN(Number(state))) {
          return `${state}m`;
        }
        return remainingTimeEntity.state || "Loading...";
      }
      return "Loading...";
    }

    // Only use haEntity if no remainingTimeEntityId provided
    if (haEntity) {
      return haEntity.state || "Unknown";
    }

    return "Debug Mode";
  };

  // Get remaining time in minutes from the separate entity
  const getRemainingMinutes = () => {
    if (!remainingTimeEntity) {
      return null;
    }

    const state = remainingTimeEntity.state;
    const attributes = remainingTimeEntity.attributes || {};

    // Check if state is minutes remaining
    if (state && !isNaN(Number(state))) {
      const minutes = Number(state);
      return minutes; // Return the actual value, even if 0
    }

    // Check for remaining_time attribute
    if (attributes.remaining_time) {
      const remaining = attributes.remaining_time;
      if (typeof remaining === "string") {
        const durationMs = parseDuration(remaining);
        if (durationMs) {
          return Math.round(durationMs / (1000 * 60));
        }
      }
    }

    return null;
  };

  // Calculate progress percentage for the progress bar
  const getProgressPercentage = () => {
    if (!haEntity) {
      // For debug example, calculate progress from 5 minutes
      const totalTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      const now = currentTime.getTime();
      const startTime = now - totalTime;
      const elapsed = now - startTime;
      return Math.max(0, Math.min(100, (elapsed / totalTime) * 100));
    }

    const state = haEntity.state;
    const attributes = haEntity.attributes || {};

    // Check if state is a direct percentage value (like "4" for 4%)
    if (state && !isNaN(Number(state))) {
      const percentage = Number(state);
      if (percentage >= 0 && percentage <= 100) {
        return percentage;
      }
    }

    // Check if state is a percentage string (like "4%")
    if (state && typeof state === "string" && state.includes("%")) {
      const percentage = parseInt(state.replace("%", ""));
      if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
        return percentage;
      }
    }

    // If remaining time shows "Completed", return 100%
    if (remaining && remaining.text === "Completed") {
      return 100;
    }

    // Try to get total duration from various attributes
    let totalDuration = 0;
    if (attributes.duration) {
      const duration = attributes.duration;
      if (typeof duration === "string") {
        const durationMs = parseDuration(duration);
        if (durationMs) {
          totalDuration = durationMs;
        }
      }
    }

    if (totalDuration === 0) {
      // If no duration available, calculate based on remaining time
      const remainingTime = remaining?.text || "";
      if (remainingTime.includes("h")) {
        const [hours, minutes] = remainingTime.split("h").map((s) => parseInt(s.replace(/\D/g, "") || "0"));
        totalDuration = (hours * 3600 + minutes * 60) * 1000;
      } else if (remainingTime.includes("m")) {
        const [minutes, seconds] = remainingTime.split("m").map((s) => parseInt(s.replace(/\D/g, "") || "0"));
        totalDuration = (minutes * 60 + seconds) * 1000;
      } else if (remainingTime.includes("s")) {
        const seconds = parseInt(remainingTime.replace(/\D/g, "") || "0");
        totalDuration = seconds * 1000;
      }

      // If we still can't determine total duration, use a default
      if (totalDuration === 0) {
        totalDuration = 5 * 60 * 1000; // Default to 5 minutes
      }
    }

    // Calculate remaining time in milliseconds
    let remainingMs = 0;
    if (remaining?.text) {
      if (remaining.text.includes("h")) {
        const [hours, minutes] = remaining.text.split("h").map((s) => parseInt(s.replace(/\D/g, "") || "0"));
        remainingMs = (hours * 3600 + minutes * 60) * 1000;
      } else if (remaining.text.includes("m")) {
        const [minutes, seconds] = remaining.text.split("m").map((s) => parseInt(s.replace(/\D/g, "") || "0"));
        remainingMs = (minutes * 60 + seconds) * 1000;
      } else if (remaining.text.includes("s")) {
        const seconds = parseInt(remaining.text.replace(/\D/g, "") || "0");
        remainingMs = seconds * 1000;
      }
    }

    const elapsed = totalDuration - remainingMs;
    const progress = (elapsed / totalDuration) * 100;

    return Math.max(0, Math.min(100, progress));
  };

  const progressPercentage = getProgressPercentage();

  // Always show remaining minutes in subtitle
  const getSubtitleText = () => {
    // Check if unavailable first - show nothing
    if (unavailable) {
      return "";
    }

    const remainingMinutes = getRemainingMinutes();

    if (remainingMinutes !== null) {
      if (remainingMinutes <= 0) {
        return "Completed";
      }
      return `${remainingMinutes}m`;
    }
    return "Loading...";
  };

  return (
    <Card
      title={showTitle ? `${title}` : ""}
      subtitle={showSubtitle ? getSubtitleText() : ""}
      icon={showIcon ? <Timer className="w-5 h-5" /> : undefined}
      onTitleChange={onTitleChange}
      onJsonSave={onJsonSave}
      onCardDelete={onCardDelete}
      cardConfig={cardConfig}
      entityId={entityId}
      className={`relative overflow-hidden bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 shadow-xl ${className}`}
      width={width}
      height="h-16"
    >
      {/* Content overlay */}
      <div className="relative z-10 flex items-center justify-between h-full px-4">
        {/* Left side - Title and subtitle */}
        <div className="flex-1 min-w-0">
          {showTitle && (
            <div className="text-sm font-medium text-white truncate drop-shadow-sm">
              {title} ({getSensorState()})
            </div>
          )}
          {showSubtitle && <div className="text-xs text-gray-300 truncate drop-shadow-sm">{getSubtitleText()}</div>}
        </div>

        {/* Right side - Circular progress and time */}
        <div className="flex items-center space-x-3 ml-2">
          {/* Circular progress ring */}
          <div className="relative w-12 h-12 flex-shrink-0">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
              {/* Background circle */}
              <path
                className="text-gray-700/50"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845
                   a 15.9155 15.9155 0 0 1 0 31.831
                   a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* Progress circle */}
              {unavailable ? (
                /* Unavailable state - show a dotted circle */
                <path
                  className="text-gray-500"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="4,4"
                  d="M18 2.0845
                     a 15.9155 15.9155 0 0 1 0 31.831
                     a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              ) : (
                <path
                  className={`transition-all duration-1000 ${getCircleColor(progressPercentage)}`}
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${progressPercentage}, 100`}
                  d="M18 2.0845
                     a 15.9155 15.9155 0 0 1 0 31.831
                     a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              )}
            </svg>
            {/* Percentage text in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-md">{unavailable ? "N/A" : `${Math.round(progressPercentage)}%`}</span>
            </div>
          </div>

          {/* Time remaining text */}
          <div className="text-right min-w-0">
            <div className="text-sm font-medium text-white drop-shadow-md truncate">{unavailable ? "" : remaining?.text || "Loading..."}</div>
            {showIcon && (
              <div className="flex items-center justify-end mt-1">
                <Timer className="w-3 h-3 text-white/60 drop-shadow-sm" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom progress indicator line */}
      {!unavailable && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/30">
          {progressPercentage > 0 ? (
            <div className={`h-full transition-all duration-1000 ${getProgressColor(progressPercentage)}`} style={{ width: `${progressPercentage}%` }} />
          ) : (
            <div className="h-full bg-gradient-to-r from-gray-500/40 to-gray-400/40 animate-pulse" />
          )}
        </div>
      )}

      {/* Enhanced circular progress with better styling */}
      <div className="absolute top-1 right-1 bottom-1 w-14">
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 transform -rotate-90 drop-shadow-lg" viewBox="0 0 36 36">
              {/* Background circle with glow effect */}
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={progressPercentage === 0 ? "rgba(75, 85, 99, 0.2)" : "rgba(75, 85, 99, 0.4)"}
                strokeWidth="3"
                className="drop-shadow-sm"
              />
              {/* Progress circle with enhanced styling */}
              {unavailable ? (
                /* Unavailable state - show a dotted rounded circle */
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(143, 143, 143, 0.8)"
                  strokeWidth="2"
                  strokeDasharray="6,6.5"
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              ) : progressPercentage > 0 ? (
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={
                    progressPercentage >= 100
                      ? "#10b981" // green-500
                      : progressPercentage >= 75
                      ? "#eab308" // yellow-500
                      : progressPercentage >= 50
                      ? "#f97316" // orange-500
                      : "#ef4444" // red-500
                  }
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${progressPercentage}, 100`}
                  className="transition-all duration-1000 drop-shadow-md"
                  style={{
                    filter: `drop-shadow(0 0 4px ${
                      progressPercentage >= 100
                        ? "rgba(16, 185, 129, 0.4)"
                        : progressPercentage >= 75
                        ? "rgba(234, 179, 8, 0.4)"
                        : progressPercentage >= 50
                        ? "rgba(249, 115, 22, 0.4)"
                        : "rgba(239, 68, 68, 0.4)"
                    })`,
                  }}
                />
              ) : (
                /* Special 0% state - show a dashed rounded circle */
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(156, 163, 175, 0.6)"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  className="transition-all duration-1000"
                />
              )}
            </svg>
            {/* Enhanced center percentage text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-md">{unavailable ? "N/A" : `${Math.round(progressPercentage)}%`}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
