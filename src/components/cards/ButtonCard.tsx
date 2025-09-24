import React, { useState, useEffect } from "react";
import { Power, Play, Pause, RotateCcw, Settings, DoorOpen, Monitor, Trash2 } from "lucide-react";
import { Card } from "./Card";
import { useHomeAssistantStore } from "../../store/useHomeAssistantStore";
import { useHomeAssistant } from "../../hooks/useHomeAssistant";

interface ButtonCardProps {
  title: string;
  icon?: React.ReactNode;
  iconName?: string; // Icon name for JSON override
  onClick?: () => void;
  onTitleChange?: (title: string, entityId?: string) => void;
  entityId?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  vibrationDuration?: number; // Duration in seconds for vibration animation
}

export const ButtonCard: React.FC<ButtonCardProps> = ({
  title,
  icon,
  iconName,
  onClick,
  onTitleChange,
  entityId,
  disabled = false,
  loading = false,
  className = "",
  vibrationDuration = 3,
}) => {
  const { entities } = useHomeAssistantStore();
  const { callService } = useHomeAssistant();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVibrating, setIsVibrating] = useState(false);

  // Get real-time state from Home Assistant if entityId is provided
  const haEntity = entityId ? entities.get(entityId) : null;
  const isEntityOn = haEntity ? haEntity.state === "on" : false;
  const isUnavailable = haEntity ? haEntity.state === "unavailable" : false;

  // Get icon based on iconName or default
  const getIcon = () => {
    if (icon) return icon;

    // Icon mapping for JSON override
    const iconMap: { [key: string]: React.ReactNode } = {
      power: <Power className="w-5 h-5" />,
      play: <Play className="w-5 h-5" />,
      pause: <Pause className="w-5 h-5" />,
      settings: <Settings className="w-5 h-5" />,
      rotate: <RotateCcw className="w-5 h-5" />,
      door: <DoorOpen className="w-5 h-5" />,
      pc: <Monitor className="w-5 h-5" />,
      trash: <Trash2 className="w-5 h-5" />,
    };

    return iconName && iconMap[iconName] ? iconMap[iconName] : <Power className="w-5 h-5" />;
  };

  // Update current time for relative time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second for more accurate time display

    return () => clearInterval(interval);
  }, []);

  // Get relative time since last pressed
  const getRelativeTime = (date: Date) => {
    const now = currentTime;
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Ensure we never show negative values
    if (diffInSeconds < 0) {
      return "Just now";
    }

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  // Handle toggle functionality
  const handleToggle = async () => {
    if (disabled || loading || isUnavailable || !entityId || !callService) return;

    // Start vibration animation
    setIsVibrating(true);
    setTimeout(() => {
      setIsVibrating(false);
    }, vibrationDuration * 1000);

    try {
      // Determine the appropriate service based on entity domain
      const domain = entityId.split(".")[0];
      let service = "toggle";

      // Special handling for different entity types
      if (domain === "button") {
        service = "press";
      } else if (domain === "alarm_control_panel") {
        service = isEntityOn ? "alarm_disarm" : "alarm_arm_home";
      } else if (domain === "switch" || domain === "light") {
        service = isEntityOn ? "turn_off" : "turn_on";
      } else if (domain === "cover") {
        service = isEntityOn ? "close_cover" : "open_cover";
      } else if (domain === "fan") {
        service = isEntityOn ? "turn_off" : "turn_on";
      } else if (domain === "media_player") {
        service = isEntityOn ? "media_pause" : "media_play";
      }

      await callService(domain, service, { entity_id: entityId });
      console.log(`Toggled ${entityId} using ${domain}.${service}`);
    } catch (error) {
      console.error(`Failed to toggle ${entityId}:`, error);
    }
  };

  // Create subtitle with status
  const getSubtitle = () => {
    if (loading) return "Loading...";
    if (disabled) return "Disabled";
    if (isUnavailable) return "Unavailable";
    if (entityId && haEntity) {
      // Use the entity's last_changed timestamp
      const lastChanged = new Date(haEntity.last_changed);
      return getRelativeTime(lastChanged);
    }
    if (entityId) {
      return "No data";
    }
    return "Click to activate";
  };

  return (
    <Card
      title={title}
      subtitle={getSubtitle()}
      icon={getIcon()}
      onClick={disabled || loading || isUnavailable ? undefined : entityId ? handleToggle : onClick}
      onTitleChange={onTitleChange}
      entityId={entityId}
      disabled={disabled}
      className={`bg-gradient-to-br from-gray-900/90 to-gray-800/90 ${className}`}
      width="w-full"
      height="h-16"
    >
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Status indicator */}
      {entityId && (
        <div className="absolute top-1/2 right-3 transform -translate-y-1/2">
          <div
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              isVibrating ? "bg-orange-500" : isUnavailable ? "bg-red-500" : isEntityOn ? "bg-orange-500" : "bg-gray-500"
            } ${isVibrating ? "animate-pulse scale-110" : ""}`}
            style={{
              animation: isVibrating ? `vibrate ${vibrationDuration / 3}s ease-in-out` : undefined,
            }}
          />
        </div>
      )}

      {/* CSS Animation Keyframes */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes vibrate {
              0%, 100% { transform: scale(1); }
              5% { transform: scale(1.2) translateX(-1px) translateY(-0.5px); }
              10% { transform: scale(1.2) translateX(1px) translateY(0.5px); }
              15% { transform: scale(1.2) translateX(-1px) translateY(-0.5px); }
              20% { transform: scale(1.2) translateX(1px) translateY(0.5px); }
              25% { transform: scale(1.2) translateX(-1px) translateY(-0.5px); }
              30% { transform: scale(1.2) translateX(1px) translateY(0.5px); }
              35% { transform: scale(1.2) translateX(-1px) translateY(-0.5px); }
              40% { transform: scale(1.2) translateX(1px) translateY(0.5px); }
              45% { transform: scale(1.2) translateX(-1px) translateY(-0.5px); }
              50% { transform: scale(1.2) translateX(1px) translateY(0.5px); }
              55% { transform: scale(1.2) translateX(-1px) translateY(-0.5px); }
              60% { transform: scale(1.2) translateX(1px) translateY(0.5px); }
              65% { transform: scale(1.2) translateX(-1px) translateY(-0.5px); }
              70% { transform: scale(1.2) translateX(1px) translateY(0.5px); }
              75% { transform: scale(1.2) translateX(-1px) translateY(-0.5px); }
              80% { transform: scale(1.2) translateX(1px) translateY(0.5px); }
              85% { transform: scale(1.2) translateX(-1px) translateY(-0.5px); }
              90% { transform: scale(1.2) translateX(1px) translateY(0.5px); }
              95% { transform: scale(1.2) translateX(-1px) translateY(-0.5px); }
            }
          `,
        }}
      />
    </Card>
  );
};
