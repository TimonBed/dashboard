import React, { useState, useEffect } from "react";
import { Bus, Clock } from "lucide-react";
import { Card } from "./Card";
import { useHomeAssistantStore } from "../../store/useHomeAssistantStore";

export interface BusDepartureCardProps {
  title: string;
  entityId: string;
  onTitleChange?: (newTitle: string) => void;
  className?: string;
  width?: string;
  height?: string;
  maxDepartures?: number;
}

interface BusDeparture {
  departure: string;
  line: string;
  origin: string;
  direction: string;
  type: string;
  id: string;
  delay: number;
  cancelled: boolean;
  extra: boolean;
}

export const BusDepartureCard: React.FC<BusDepartureCardProps> = ({
  title,
  entityId,
  onTitleChange,
  className = "",
  width = "w-full",
  height = "h-64",
  maxDepartures = 5,
}) => {
  const { entities } = useHomeAssistantStore();
  const haEntity = entities.get(entityId);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [previousDepartures, setPreviousDepartures] = useState<BusDeparture[]>([]);
  const [animatingOut, setAnimatingOut] = useState<Set<string>>(new Set());
  const [animatingIn, setAnimatingIn] = useState<Set<string>>(new Set());

  // Update current time every second for live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle departure animations when order changes
  useEffect(() => {
    const currentDepartures = getDepartures();

    if (previousDepartures.length === 0) {
      // Initial load - no animations
      setPreviousDepartures(currentDepartures);
      return;
    }

    const currentIds = new Set(currentDepartures.map((d) => `${d.id}-${d.departure}`));
    const previousIds = new Set(previousDepartures.map((d) => `${d.id}-${d.departure}`));

    // Find departures that are leaving (fade out)
    const leavingIds = Array.from(previousIds).filter((id) => !currentIds.has(id));
    if (leavingIds.length > 0) {
      setAnimatingOut(new Set(leavingIds));
      // Remove from animating out after fade completes
      setTimeout(() => {
        setAnimatingOut((prev) => {
          const newSet = new Set(prev);
          leavingIds.forEach((id) => newSet.delete(id));
          return newSet;
        });
      }, 300);
    }

    // Find departures that are new (fade in)
    const newIds = Array.from(currentIds).filter((id) => !previousIds.has(id));
    if (newIds.length > 0) {
      setAnimatingIn(new Set(newIds));
      // Remove from animating in after fade completes
      setTimeout(() => {
        setAnimatingIn((prev) => {
          const newSet = new Set(prev);
          newIds.forEach((id) => newSet.delete(id));
          return newSet;
        });
      }, 300);
    }

    setPreviousDepartures(currentDepartures);
  }, [haEntity?.attributes?.next, maxDepartures]);

  // Get bus departures from Home Assistant entity
  const getDepartures = (): BusDeparture[] => {
    if (!haEntity?.attributes?.next) return [];
    return haEntity.attributes.next.slice(0, maxDepartures);
  };

  // Calculate time remaining until departure
  const getTimeRemaining = (departureTime: string): string => {
    const departure = new Date(departureTime);
    const now = currentTime;
    const diffMs = departure.getTime() - now.getTime();

    if (diffMs <= 0) return "now";

    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return "now";
    if (diffMinutes === 1) return "1 min";
    if (diffMinutes < 60) return `${diffMinutes} min`;

    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;

    if (diffHours === 1 && remainingMinutes === 0) return "1h";
    if (remainingMinutes === 0) return `${diffHours}h`;
    return `${diffHours}h ${remainingMinutes}min`;
  };

  // Get line background style for Hamburg hexagon design
  const getLineBackgroundStyle = (lineNumber: string): React.CSSProperties => {
    // 6xx bus lines use gray color, others use Hamburg red
    const is6xx = lineNumber.startsWith("6");
    const backgroundColor = is6xx ? "#6B7280" : "#E2001A";
    const gradientColor = is6xx ? "#9CA3AF" : "#ff1a1a";

    return {
      background: `linear-gradient(135deg, ${backgroundColor} 0%, ${gradientColor} 100%)`,
      clipPath: "polygon(20% 0, 80% 0, 100% 50%, 80% 100%, 20% 100%, 0 50%)",
      boxShadow: `0 0 8px rgba(${is6xx ? "107, 114, 128" : "226, 0, 26"}, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
    };
  };

  // Check if departure is delayed
  const isDelayed = (departure: BusDeparture): boolean => {
    return departure.delay > 0;
  };

  // Check if departure is cancelled
  const isCancelled = (departure: BusDeparture): boolean => {
    return departure.cancelled;
  };

  const departures = getDepartures();

  return (
    <Card
      title={title}
      subtitle=""
      icon={<Bus className="w-5 h-5 text-blue-400" />}
      onTitleChange={onTitleChange}
      className={`bg-gradient-to-br from-gray-900/90 to-gray-800/90 ${className}`}
      width={width}
      height={height}
    >
      <div className="flex-1 space-y-1">
        {departures.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <Bus className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No departures available</p>
            </div>
          </div>
        ) : (
          departures.map((departure) => {
            const timeRemaining = getTimeRemaining(departure.departure);
            const delayed = isDelayed(departure);
            const cancelled = isCancelled(departure);
            const departureId = `${departure.id}-${departure.departure}`;
            const isAnimatingOut = animatingOut.has(departureId);
            const isAnimatingIn = animatingIn.has(departureId);

            return (
              <div
                key={departureId}
                className={`flex items-center justify-between py-[3px] px-2 bg-gray-800/50 rounded-lg border border-gray-700/50 transition-all duration-300 ${
                  isAnimatingOut
                    ? "opacity-0 transform -translate-y-2"
                    : isAnimatingIn
                    ? "opacity-0 transform translate-y-2 animate-in slide-in-from-bottom-2 fade-in duration-300"
                    : "opacity-100 transform translate-y-0"
                }`}
              >
                {/* Line number badge with Hamburg diamond design */}
                <div
                  className="text-white w-10 h-5 text-xs font-bold text-center flex items-center justify-center relative"
                  style={getLineBackgroundStyle(departure.line)}
                >
                  <span
                    className="relative z-10"
                    style={{
                      textShadow: "0 0 4px rgba(255, 255, 255, 0.3), 0 1px 2px rgba(0, 0, 0, 0.5)",
                    }}
                  >
                    {departure.line}
                  </span>
                </div>

                {/* Destination and origin */}
                <div className="flex-1 mx-4 min-w-0">
                  <div className="text-white font-medium truncate">
                    {departure.direction} <span className="text-gray-400 text-xs">from {departure.origin}</span>
                  </div>
                  {cancelled && <div className="text-red-400 text-xs font-medium">CANCELLED</div>}
                </div>

                {/* Time remaining */}
                <div className="flex items-center space-x-1 text-white font-medium min-w-[4rem] justify-end">
                  <Clock className="w-4 h-4" />
                  <span className={cancelled ? "line-through text-red-400" : ""}>{timeRemaining}</span>
                  {delayed && <span className="text-red-400 text-sm font-bold bg-red-900/30 px-1 rounded">+{Math.round(departure.delay / 60)}</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
