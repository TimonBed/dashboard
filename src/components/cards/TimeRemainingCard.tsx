import React, { useState, useEffect } from "react";
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
}

export type TimeRemainingCardProps = CardComponentProps<TimeRemainingCardSpecificProps>;

export const TimeRemainingCard: React.FC<TimeRemainingCardProps> = ({
  title,
  entityId,
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
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const haEntity = entityId ? entities.get(entityId) : undefined;

  // Calculate remaining time
  const getRemainingTime = () => {
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

  // Calculate progress percentage for the progress bar
  const getProgressPercentage = () => {
    if (!haEntity) {
      // For debug example, calculate progress from 5 minutes
      const totalTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      const elapsed =
        totalTime -
        (remaining
          ? remaining.text === "Completed"
            ? 0
            : parseInt(remaining.text.split("m")[0]) * 60 * 1000 +
              (remaining.text.includes("s") ? parseInt(remaining.text.split("m")[1]?.split("s")[0] || "0") * 1000 : 0)
          : totalTime);
      return Math.max(0, Math.min(100, (elapsed / totalTime) * 100));
    }

    const attributes = haEntity.attributes || {};
    const state = haEntity.state;

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
    } else if (attributes.remaining_time) {
      const remaining = attributes.remaining_time;
      if (typeof remaining === "string") {
        const parts = remaining.split(":").map(Number);
        if (parts.length === 3) {
          const [hours, minutes, seconds] = parts;
          totalDuration = (hours * 3600 + minutes * 60 + seconds) * 1000;
        }
      }
    }

    if (totalDuration === 0) return 0;

    const now = currentTime.getTime();
    let endTime: Date | null = null;

    if (attributes.end_time) {
      endTime = new Date(attributes.end_time);
    } else if (attributes.remaining_time) {
      const remaining = attributes.remaining_time;
      if (typeof remaining === "string") {
        const parts = remaining.split(":").map(Number);
        if (parts.length === 3) {
          const [hours, minutes, seconds] = parts;
          endTime = new Date(currentTime.getTime() + (hours * 3600 + minutes * 60 + seconds) * 1000);
        }
      }
    } else if (state && !isNaN(Date.parse(state))) {
      endTime = new Date(state);
    }

    if (!endTime) return 0;

    const startTime = endTime.getTime() - totalDuration;
    const elapsed = now - startTime;
    const progress = (elapsed / totalDuration) * 100;

    return Math.max(0, Math.min(100, progress));
  };

  const progressPercentage = getProgressPercentage();

  return (
    <Card
      title={showTitle ? title : ""}
      subtitle={showSubtitle ? remaining?.text || "N/A" : ""}
      icon={showIcon ? <Timer className="w-5 h-5" /> : undefined}
      onTitleChange={onTitleChange}
      onJsonSave={onJsonSave}
      onCardDelete={onCardDelete}
      cardConfig={cardConfig}
      entityId={entityId}
      className={`bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 shadow-xl ${className}`}
      width={width}
      height="h-16"
    >
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
              {progressPercentage > 0 ? (
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
                /* Special 0% state - show a dashed circle */
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
              <span className="text-xs font-bold text-white drop-shadow-md">{Math.round(progressPercentage)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle progress indicator line at bottom */}
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
    </Card>
  );
};
