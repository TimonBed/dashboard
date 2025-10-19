import React from "react";
import { Timer } from "lucide-react";
import { Card } from "./Card";
import { useHomeAssistantStore } from "../../store/useHomeAssistantStore";
import { CardComponentProps } from "../../types/cardProps";

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

  // Get entities dynamically in render functions to handle late loading
  const getHaEntity = () => (entityId ? entities.get(entityId) : undefined);
  const getRemainingTimeEntity = () => (remainingTimeEntityId ? entities.get(remainingTimeEntityId) : undefined);

  // Calculate remaining time
  const getRemainingTime = () => {
    const remainingTimeEntity = getRemainingTimeEntity();

    // If we have a separate remaining time entity, use that
    if (remainingTimeEntity) {
      const state = remainingTimeEntity.state;
      const attributes = remainingTimeEntity.attributes || {};

      // Check if state is minutes remaining (simple number)
      if (state && !isNaN(Number(state))) {
        const minutes = Number(state);
        if (minutes <= 0) return { text: "Completed", color: "text-green-400" };

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        let timeText = "";
        if (hours > 0) {
          timeText = `${hours}h ${remainingMinutes}m`;
        } else {
          timeText = `${remainingMinutes}m`;
        }

        // Color based on remaining time
        let color = "text-green-400";
        if (minutes < 1) color = "text-red-400"; // Less than 1 minute
        else if (minutes < 5) color = "text-orange-400"; // Less than 5 minutes
        else if (minutes < 30) color = "text-yellow-400"; // Less than 30 minutes

        return { text: timeText, color };
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
          // Parse duration string like "00:15:30"
          const parts = remaining.split(":").map(Number);
          if (parts.length === 3) {
            const [hours, minutes, seconds] = parts;
            endTime = new Date(currentTime.getTime() + (hours * 3600 + minutes * 60 + seconds) * 1000);
          }
        }
      }
      // Check for duration attribute
      else if (attributes.duration) {
        const duration = attributes.duration;
        if (typeof duration === "string") {
          const parts = duration.split(":").map(Number);
          if (parts.length === 3) {
            const [hours, minutes, seconds] = parts;
            endTime = new Date(currentTime.getTime() + (hours * 3600 + minutes * 60 + seconds) * 1000);
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

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        let timeText = "";
        if (hours > 0) {
          timeText = `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
          timeText = `${minutes}m ${seconds}s`;
        } else {
          timeText = `${seconds}s`;
        }

        // Color based on remaining time
        let color = "text-green-400";
        if (remaining < 60000) color = "text-red-400"; // Less than 1 minute
        else if (remaining < 300000) color = "text-orange-400"; // Less than 5 minutes
        else if (remaining < 1800000) color = "text-yellow-400"; // Less than 30 minutes

        return { text: timeText, color };
      }
    }

    const haEntity = getHaEntity();

    if (!haEntity) {
      // Example time for debugging - 5 minutes from now
      const exampleEndTime = new Date(currentTime.getTime() + 5 * 60 * 1000);
      const remaining = exampleEndTime.getTime() - currentTime.getTime();

      if (remaining <= 0) return { text: "Completed", color: "text-green-400" };

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      let timeText = "";
      if (hours > 0) {
        timeText = `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        timeText = `${minutes}m ${seconds}s`;
      } else {
        timeText = `${seconds}s`;
      }

      // Color based on remaining time
      let color = "text-green-400";
      if (remaining < 60000) color = "text-red-400"; // Less than 1 minute
      else if (remaining < 300000) color = "text-orange-400"; // Less than 5 minutes
      else if (remaining < 1800000) color = "text-yellow-400"; // Less than 30 minutes

      return { text: timeText, color };
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
        // Parse duration string like "00:15:30"
        const parts = remaining.split(":").map(Number);
        if (parts.length === 3) {
          const [hours, minutes, seconds] = parts;
          endTime = new Date(currentTime.getTime() + (hours * 3600 + minutes * 60 + seconds) * 1000);
        }
      }
    }
    // Check for duration attribute
    else if (attributes.duration) {
      const duration = attributes.duration;
      if (typeof duration === "string") {
        const parts = duration.split(":").map(Number);
        if (parts.length === 3) {
          const [hours, minutes, seconds] = parts;
          endTime = new Date(currentTime.getTime() + (hours * 3600 + minutes * 60 + seconds) * 1000);
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

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    let timeText = "";
    if (hours > 0) {
      timeText = `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      timeText = `${minutes}m ${seconds}s`;
    } else {
      timeText = `${seconds}s`;
    }

    // Color based on remaining time
    let color = "text-green-400";
    if (remaining < 60000) color = "text-red-400"; // Less than 1 minute
    else if (remaining < 300000) color = "text-orange-400"; // Less than 5 minutes
    else if (remaining < 1800000) color = "text-yellow-400"; // Less than 30 minutes

    return { text: timeText, color };
  };

  const remaining = getRemainingTime();

  // Get sensor state for title - always use remainingTimeEntityId if provided
  const getSensorState = () => {
    const remainingTimeEntity = getRemainingTimeEntity();

    console.log("TimeRemainingCard: getSensorState - remainingTimeEntity:", remainingTimeEntity, "remainingTimeEntityId:", remainingTimeEntityId);

    // Always use remainingTimeEntity if remainingTimeEntityId is provided
    if (remainingTimeEntityId) {
      if (remainingTimeEntity) {
        const state = remainingTimeEntity.state;
        console.log("TimeRemainingCard: getSensorState - remainingTimeEntity state:", state);
        if (state && !isNaN(Number(state))) {
          return `${state}m`;
        }
        return remainingTimeEntity.state || "Loading...";
      }
      return "Loading...";
    }

    // Only use haEntity if no remainingTimeEntityId provided
    const haEntity = getHaEntity();
    if (haEntity) {
      console.log("TimeRemainingCard: getSensorState - using haEntity state:", haEntity.state);
      return haEntity.state || "Unknown";
    }

    return "Debug Mode";
  };

  // Get remaining time in minutes from the separate entity
  const getRemainingMinutes = () => {
    const remainingTimeEntity = getRemainingTimeEntity();

    if (!remainingTimeEntity) {
      console.log("TimeRemainingCard: No remainingTimeEntity found");
      return null;
    }

    const state = remainingTimeEntity.state;
    const attributes = remainingTimeEntity.attributes || {};

    console.log("TimeRemainingCard: remainingTimeEntity state:", state, "attributes:", attributes);

    // Check if state is minutes remaining
    if (state && !isNaN(Number(state))) {
      const minutes = Number(state);
      console.log("TimeRemainingCard: Found numeric state, minutes:", minutes);
      return minutes; // Return the actual value, even if 0
    }

    // Check for remaining_time attribute
    if (attributes.remaining_time) {
      const remaining = attributes.remaining_time;
      if (typeof remaining === "string") {
        const parts = remaining.split(":").map(Number);
        if (parts.length === 3) {
          const [hours, minutes, seconds] = parts;
          const totalMinutes = hours * 60 + minutes + Math.round(seconds / 60);
          console.log("TimeRemainingCard: Found remaining_time attribute, total minutes:", totalMinutes);
          return totalMinutes;
        }
      }
    }

    console.log("TimeRemainingCard: No valid remaining time data found");
    return null;
  };

  // Calculate progress percentage for the progress bar
  const getProgressPercentage = () => {
    const haEntity = getHaEntity();

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
        const parts = duration.split(":").map(Number);
        if (parts.length === 3) {
          const [hours, minutes, seconds] = parts;
          totalDuration = (hours * 3600 + minutes * 60 + seconds) * 1000;
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

  // Check if entity is unavailable
  const isUnavailable = () => {
    const haEntity = getHaEntity();
    const remainingTimeEntity = getRemainingTimeEntity();

    // Check if either entity is unavailable
    if (haEntity && haEntity.state === "unavailable") return true;
    if (remainingTimeEntity && remainingTimeEntity.state === "unavailable") return true;

    // If no entities are loaded, consider unavailable
    if (!haEntity && !remainingTimeEntity) return true;

    return false;
  };

  // Always show remaining minutes in subtitle
  const getSubtitleText = () => {
    // Check if unavailable first - show nothing
    if (isUnavailable()) {
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
              {isUnavailable() ? (
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
                  className={`transition-all duration-1000 ${
                    progressPercentage >= 100
                      ? "text-green-500"
                      : progressPercentage >= 75
                      ? "text-yellow-500"
                      : progressPercentage >= 50
                      ? "text-orange-500"
                      : "text-red-500"
                  }`}
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
              <span className="text-xs font-bold text-white drop-shadow-md">{isUnavailable() ? "N/A" : `${Math.round(progressPercentage)}%`}</span>
            </div>
          </div>

          {/* Time remaining text */}
          <div className="text-right min-w-0">
            <div className="text-sm font-medium text-white drop-shadow-md truncate">{isUnavailable() ? "" : remaining?.text || "Loading..."}</div>
            {showIcon && (
              <div className="flex items-center justify-end mt-1">
                <Timer className="w-3 h-3 text-white/60 drop-shadow-sm" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom progress indicator line */}
      {!isUnavailable() && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/30">
          {progressPercentage > 0 ? (
            <div
              className={`h-full transition-all duration-1000 ${
                progressPercentage >= 100
                  ? "bg-gradient-to-r from-green-500 to-green-400"
                  : progressPercentage >= 75
                  ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                  : progressPercentage >= 50
                  ? "bg-gradient-to-r from-orange-500 to-orange-400"
                  : "bg-gradient-to-r from-red-500 to-red-400"
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
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
                strokeWidth="3"
                className="drop-shadow-sm"
              />
              {/* Progress circle with enhanced styling */}
              {isUnavailable() ? (
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
              <span className="text-xs font-bold text-white drop-shadow-md">{isUnavailable() ? "N/A" : `${Math.round(progressPercentage)}%`}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle progress indicator line at bottom */}
      {!isUnavailable() && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-700/30">
          {progressPercentage > 0 ? (
            <div
              className={`h-full transition-all duration-1000 ${
                progressPercentage >= 100
                  ? "bg-gradient-to-r from-green-500 to-green-400"
                  : progressPercentage >= 75
                  ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                  : progressPercentage >= 50
                  ? "bg-gradient-to-r from-orange-500 to-orange-400"
                  : "bg-gradient-to-r from-red-500 to-red-400"
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          ) : (
            /* 0% state - show a subtle pulsing indicator */
            <div className="h-full bg-gradient-to-r from-gray-500/40 to-gray-400/40 animate-pulse" />
          )}
        </div>
      )}
    </Card>
  );
};
