import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Bus, Clock, Settings, X, Save } from "lucide-react";
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
  showAllItems?: boolean;
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
  maxDepartures = 5,
  showAllItems = false,
}) => {
  const { entities } = useHomeAssistantStore();
  const haEntity = entities.get(entityId);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [previousDepartures, setPreviousDepartures] = useState<BusDeparture[]>([]);
  const [animatingOut, setAnimatingOut] = useState<Set<string>>(new Set());
  const [animatingIn, setAnimatingIn] = useState<Set<string>>(new Set());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [localMaxDepartures, setLocalMaxDepartures] = useState(maxDepartures);
  const [localShowAllItems, setLocalShowAllItems] = useState(showAllItems);

  // Update current time every 30 seconds for live countdown (reduced frequency for performance)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // 30 seconds instead of 1 second

    return () => clearInterval(interval);
  }, []);

  // Get bus departures from Home Assistant entity - memoized for performance
  const departures = useMemo((): BusDeparture[] => {
    if (!haEntity?.attributes?.next) return [];
    const allDepartures = haEntity.attributes.next;
    return localShowAllItems ? allDepartures : allDepartures.slice(0, localMaxDepartures);
  }, [haEntity?.attributes?.next, localShowAllItems, localMaxDepartures]);

  // Handle departure animations when order changes
  useEffect(() => {
    if (previousDepartures.length === 0) {
      // Initial load - no animations
      setPreviousDepartures(departures);
      return;
    }

    const currentIds = new Set(departures.map((d: BusDeparture) => `${d.id}-${d.departure}`));
    const previousIds = new Set(previousDepartures.map((d: BusDeparture) => `${d.id}-${d.departure}`));

    // Find departures that are leaving (fade out)
    const leavingIds = Array.from(previousIds).filter((id: string) => !currentIds.has(id));
    if (leavingIds.length > 0) {
      setAnimatingOut(new Set(leavingIds));
      // Remove from animating out after fade completes
      setTimeout(() => {
        setAnimatingOut((prev) => {
          const newSet = new Set(prev);
          leavingIds.forEach((id: string) => newSet.delete(id));
          return newSet;
        });
      }, 300);
    }

    // Find departures that are new (fade in)
    const newIds = Array.from(currentIds).filter((id: string) => !previousIds.has(id));
    if (newIds.length > 0) {
      setAnimatingIn(new Set(newIds));
      // Remove from animating in after fade completes
      setTimeout(() => {
        setAnimatingIn((prev) => {
          const newSet = new Set(prev);
          newIds.forEach((id: string) => newSet.delete(id));
          return newSet;
        });
      }, 300);
    }

    setPreviousDepartures(departures);
  }, [departures, previousDepartures.length]);

  // Calculate time remaining until departure - memoized for performance
  const getTimeRemaining = useCallback((departureTime: string): string => {
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
  }, [currentTime]);

  // Get line background style for Hamburg hexagon design - memoized for performance
  const getLineBackgroundStyle = useCallback((lineNumber: string): React.CSSProperties => {
    // 6xx bus lines use gray color, others use Hamburg red
    const is6xx = lineNumber.startsWith("6");
    const backgroundColor = is6xx ? "#6B7280" : "#E2001A";
    const gradientColor = is6xx ? "#9CA3AF" : "#ff1a1a";

    return {
      background: `linear-gradient(135deg, ${backgroundColor} 0%, ${gradientColor} 100%)`,
      clipPath: "polygon(20% 0, 80% 0, 100% 50%, 80% 100%, 20% 100%, 0 50%)",
      boxShadow: `0 0 8px rgba(${is6xx ? "107, 114, 128" : "226, 0, 26"}, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
    };
  }, []);

  // Check if departure is delayed - memoized for performance
  const isDelayed = useCallback((departure: BusDeparture): boolean => {
    return departure.delay > 0;
  }, []);

  // Check if departure is cancelled - memoized for performance
  const isCancelled = useCallback((departure: BusDeparture): boolean => {
    return departure.cancelled;
  }, []);

  // Calculate dynamic height based on number of departures - memoized for performance
  const calculateHeight = useMemo((): string => {
    const itemHeight = 48; // Approximate height per departure item
    const headerHeight = 60; // Approximate height for card header
    const padding = 16; // Padding
    const totalHeight = headerHeight + (departures.length * itemHeight) + padding;
    
    // Round up to nearest h-16 step (64px)
    const h16Steps = Math.ceil(totalHeight / 64);
    return `h-${h16Steps * 16}`;
  }, [departures.length]);

  // Handle right-click to open settings - memoized for performance
  const handleRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsSettingsOpen(true);
  }, []);

  // Handle settings save - memoized for performance
  const handleSaveSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  // Memoized departure item component for better performance
  const DepartureItem = React.memo(({ departure }: { departure: BusDeparture }) => {
            const timeRemaining = getTimeRemaining(departure.departure);
            const delayed = isDelayed(departure);
            const cancelled = isCancelled(departure);
            const departureId = `${departure.id}-${departure.departure}`;
            const isAnimatingOut = animatingOut.has(departureId);
            const isAnimatingIn = animatingIn.has(departureId);

            return (
              <div
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
  });

  return (
    <>
      <Card
        title={title}
        subtitle=""
        icon={<Bus className="w-5 h-5 text-blue-400" />}
        onTitleChange={onTitleChange}
        className={`bg-gradient-to-br from-gray-900/90 to-gray-800/90 ${className}`}
        width={width}
         height={calculateHeight}
        onMouseDown={handleRightClick}
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
          departures.map((departure) => (
            <DepartureItem key={`${departure.id}-${departure.departure}`} departure={departure} />
          ))
        )}
      </div>
    </Card>

      {/* Custom Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl w-96 max-w-[90vw] max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white">Bus Departure Settings</h2>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 rounded-xl bg-white/5 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Show All Items Toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localShowAllItems}
                    onChange={(e) => setLocalShowAllItems(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-white font-medium">Show All Departures</span>
                </label>
                <p className="text-gray-400 text-sm mt-1 ml-7">
                  When enabled, all available departures will be shown with dynamic height
                </p>
              </div>

              {/* Max Departures (only show when not showing all) */}
              {!localShowAllItems && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Maximum Departures: {localMaxDepartures}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={localMaxDepartures}
                    onChange={(e) => setLocalMaxDepartures(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(localMaxDepartures / 20) * 100}%, #374151 ${(localMaxDepartures / 20) * 100}%, #374151 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1</span>
                    <span>20</span>
                  </div>
                </div>
              )}

            
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700/50">
              <button 
                onClick={() => setIsSettingsOpen(false)} 
                className="px-4 py-2 text-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
