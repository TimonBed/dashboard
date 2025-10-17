import React, { useState, useEffect, memo, useMemo, useCallback } from "react";
import { MapPin, Home, Car, Plane, Train, Ship, Building, User } from "lucide-react";
import { Card } from "./Card";
import { useHomeAssistantStore } from "../../store/useHomeAssistantStore";
import Badge from "../ui/Badge";
import { CardComponentProps } from "../../types/cardProps";

interface PersonCardSpecificProps {
  title: string;
  width?: string;
  height?: string;
  showIcon?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
}

export type PersonCardProps = CardComponentProps<PersonCardSpecificProps>;

const PersonCardComponent: React.FC<PersonCardProps> = ({
  title,
  entityId,
  onTitleChange,
  onJsonSave,
  onCardDelete,
  cardConfig,
  className = "",
  width = "w-full",
  height = "h-16",
  showIcon = true,
  showTitle = true,
  showSubtitle = true,
}) => {
  const { entities } = useHomeAssistantStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const haEntity = entityId ? entities.get(entityId) : undefined;
  const isUnavailable = haEntity ? haEntity.state === "unavailable" : false;
  const currentLocation = haEntity?.state || "unknown";

  // Update time every second for relative time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get location icon based on current location - memoized
  const locationIcon = useMemo(() => {
    if (isUnavailable) return <User className="w-5 h-5 text-red-400" />;

    const location = currentLocation.toLowerCase();

    if (location === "home") {
      return <Home className="w-5 h-5 text-green-400" />;
    } else if (location.includes("car") || location.includes("vehicle")) {
      return <Car className="w-5 h-5 text-blue-400" />;
    } else if (location.includes("plane") || location.includes("airport")) {
      return <Plane className="w-5 h-5 text-sky-400" />;
    } else if (location.includes("train") || location.includes("station")) {
      return <Train className="w-5 h-5 text-purple-400" />;
    } else if (location.includes("ship") || location.includes("boat")) {
      return <Ship className="w-5 h-5 text-cyan-400" />;
    } else if (location.includes("work") || location.includes("office")) {
      return <Building className="w-5 h-5 text-orange-400" />;
    } else {
      return <MapPin className="w-5 h-5 text-gray-400" />;
    }
  }, [isUnavailable, currentLocation]);

  // Get location variant for Badge - memoized
  const locationVariant = useMemo(() => {
    if (isUnavailable) return "red";

    const location = currentLocation.toLowerCase();

    if (location === "home") {
      return "green";
    } else if (location.includes("car") || location.includes("vehicle")) {
      return "default";
    } else if (location.includes("plane") || location.includes("airport")) {
      return "default";
    } else if (location.includes("train") || location.includes("station")) {
      return "default";
    } else if (location.includes("ship") || location.includes("boat")) {
      return "default";
    } else if (location.includes("work") || location.includes("office")) {
      return "orange";
    } else {
      return "gray";
    }
  }, [isUnavailable, currentLocation]);

  // Get relative time since last changed - memoized
  const getRelativeTime = useCallback(
    (timestamp: string) => {
      const lastChanged = new Date(timestamp);
      const diffInSeconds = Math.floor((currentTime.getTime() - lastChanged.getTime()) / 1000);

      if (diffInSeconds < 0) return "Just now";
      if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    },
    [currentTime]
  );

  // Get subtitle text - memoized
  const subtitle = useMemo(() => {
    if (isUnavailable) return "Unavailable";
    if (!haEntity) return "No data";

    // Show relative time since last changed
    if (haEntity.last_changed) {
      return getRelativeTime(haEntity.last_changed);
    }

    return "No timestamp";
  }, [isUnavailable, haEntity, getRelativeTime]);

  // Get card background color based on location - memoized
  const cardBackground = useMemo(() => {
    if (isUnavailable) return "bg-gradient-to-br from-red-900/20 to-red-800/20";
    if (!haEntity) return "bg-gradient-to-br from-gray-900/90 to-gray-800/90";

    const location = currentLocation.toLowerCase();

    if (location === "home") return "bg-gradient-to-br from-green-900/20 to-green-800/20";
    if (location.includes("car") || location.includes("vehicle")) return "bg-gradient-to-br from-blue-900/20 to-blue-800/20";
    if (location.includes("plane") || location.includes("airport")) return "bg-gradient-to-br from-sky-900/20 to-sky-800/20";
    if (location.includes("train") || location.includes("station")) return "bg-gradient-to-br from-purple-900/20 to-purple-800/20";
    if (location.includes("ship") || location.includes("boat")) return "bg-gradient-to-br from-cyan-900/20 to-cyan-800/20";
    if (location.includes("work") || location.includes("office")) return "bg-gradient-to-br from-orange-900/20 to-orange-800/20";
    return "bg-gradient-to-br from-gray-900/90 to-gray-800/90";
  }, [isUnavailable, haEntity, currentLocation]);

  return (
    <Card
      title={showTitle ? title : ""}
      subtitle={showSubtitle ? subtitle : ""}
      icon={showIcon ? locationIcon : undefined}
      onTitleChange={onTitleChange}
      onJsonSave={onJsonSave}
      onCardDelete={onCardDelete}
      cardConfig={cardConfig}
      entityId={entityId}
      className={`${cardBackground} ${className}`}
      width={width}
      height={height}
    >
      {/* Location details on right side */}
      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 flex items-center space-x-2">
        <Badge variant={locationVariant}>
          <span className="text-sm font-semibold capitalize">
            {currentLocation === "unknown" ? "Unknown" : currentLocation === "not_home" ? "Away" : currentLocation}
          </span>
        </Badge>
      </div>
    </Card>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const PersonCard = memo(PersonCardComponent);
