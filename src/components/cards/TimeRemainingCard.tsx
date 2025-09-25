import React, { useState, useEffect } from "react";
import { Timer } from "lucide-react";
import { Card } from "./Card";
import { useHomeAssistantStore } from "../../store/useHomeAssistantStore";

export interface TimeRemainingCardProps {
  title: string;
  entityId: string;
  onTitleChange?: (newTitle: string) => void;
  className?: string;
  width?: string;
  height?: string;
  showIcon?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
}

export const TimeRemainingCard: React.FC<TimeRemainingCardProps> = ({
  title,
  entityId,
  onTitleChange,
  className = "",
  width = "w-full",
  height = "h-20",
  showIcon = true,
  showTitle = true,
  showSubtitle = true,
}) => {
  const { entities } = useHomeAssistantStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [progressHistory, setProgressHistory] = useState<number[]>([]);

  // Update time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const haEntity = entities.get(entityId);

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

  // Update progress history
  useEffect(() => {
    if (progressPercentage !== undefined) {
      setProgressHistory((prev) => {
        const newHistory = [...prev, progressPercentage];
        // Keep only last 60 data points (1 minute of history)
        return newHistory.slice(-60);
      });
    }
  }, [progressPercentage]);

  // Initialize with some sample data for immediate visibility
  useEffect(() => {
    if (progressHistory.length === 0) {
      // Create initial sample data for debugging - starts at 100% and goes down to 5%
      const sampleData = Array.from({ length: 30 }, (_, i) => {
        const progress = 100 - (i / 29) * 95; // From 100% down to 5%
        const variation = Math.sin(i * 0.2) * 3; // Small variation
        return Math.max(5, Math.min(100, progress + variation));
      });
      setProgressHistory(sampleData);
    }
  }, [progressPercentage, progressHistory.length]);

  // Generate SVG path for the progress graph
  const generateGraphPath = () => {
    if (progressHistory.length < 2) return "";

    const width = 1500; // Graph width
    const height = 600; // Graph height
    const padding = 0; // No padding for full width

    const points = progressHistory.map((progress, index) => {
      const x = (index / (progressHistory.length - 1)) * width;
      const y = padding + (progress / 100) * (height - padding * 2);
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  };

  return (
    <Card
      title={showTitle ? title : ""}
      subtitle={showSubtitle ? remaining?.text || "N/A" : ""}
      icon={showIcon ? <Timer className="w-5 h-5" /> : undefined}
      onTitleChange={onTitleChange}
      className={`bg-gradient-to-br from-gray-900/90 to-gray-800/90 ${className}`}
      width={width}
      height={height}
    >
      {/* Background progress graph - simple line graph */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 200 60" className="w-full h-full">
          {progressHistory.length >= 2 && (
            <>
              <path d={generateGraphPath()} stroke="#f97316" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              {/* Fill area under the curve */}
              <path d={`${generateGraphPath()} L 200,60 L 0,60 Z`} fill="#f97316" fillOpacity="0.25" />
            </>
          )}
        </svg>
      </div>

      {/* Progress bar in subtitle area */}
      <div className="absolute bottom-2 left-2 right-2 h-2 bg-gray-700 rounded overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            progressPercentage >= 100 ? "bg-green-500" : progressPercentage >= 75 ? "bg-yellow-500" : progressPercentage >= 50 ? "bg-orange-500" : "bg-red-500"
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </Card>
  );
};
