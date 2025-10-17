import React from "react";
import { CheckCircle, XCircle, AlertCircle, ToggleLeft, ToggleRight, Star, Power, Lightbulb, Shield, Lock, Unlock, Play, Pause } from "lucide-react";
import { Card } from "./Card";
import { useHomeAssistantStore } from "../../store/useHomeAssistantStore";
import { useHomeAssistant } from "../../hooks/useHomeAssistant";
import { CardComponentProps } from "../../types/cardProps";

interface BinarySwitchCardSpecificProps {
  title: string;
  width?: string;
  height?: string;
  showIcon?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
}

export type BinarySwitchCardProps = CardComponentProps<BinarySwitchCardSpecificProps>;

export const BinarySwitchCard: React.FC<BinarySwitchCardProps> = ({
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
  const { callService } = useHomeAssistant();
  const haEntity = entityId ? entities.get(entityId) : undefined;
  const isUnavailable = haEntity ? haEntity.state === "unavailable" : false;
  const isOn = haEntity ? haEntity.state === "on" : false;

  // Get appropriate icon based on state
  const getIcon = () => {
    if (isUnavailable) return <AlertCircle className="w-5 h-5 text-red-400" />;
    return isOn ? <CheckCircle className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-gray-400" />;
  };

  // Get subtitle text
  const getSubtitle = () => {
    if (isUnavailable) return "Unavailable";
    if (!haEntity) return "No data";
    return isOn ? "ON" : "OFF";
  };

  // Get status color for the indicator
  const getStatusColor = () => {
    if (isUnavailable) return "bg-red-500";
    if (!haEntity) return "bg-gray-500";
    return isOn ? "bg-green-500" : "bg-gray-500";
  };

  // Get card background color based on state
  const getCardBackground = () => {
    if (isUnavailable) return "bg-gradient-to-br from-red-900/20 to-red-800/20";
    if (isOn) return "bg-gradient-to-br from-green-900/20 to-green-800/20";
    return "bg-gradient-to-br from-gray-900/90 to-gray-800/90";
  };

  // Get dynamic icon based on entity type and state
  const getSwitchIcon = () => {
    if (isUnavailable || !entityId) return <AlertCircle className="w-3 h-3 text-red-400" />;

    const domain = entityId.split(".")[0];
    const friendlyName = haEntity?.attributes?.friendly_name?.toLowerCase() || "";

    // Icon based on entity type and friendly name
    if (domain === "light" || friendlyName.includes("light") || friendlyName.includes("licht")) {
      return <Lightbulb className="w-3 h-3 text-white fill-current" />;
    } else if (domain === "alarm_control_panel" || friendlyName.includes("alarm") || friendlyName.includes("security")) {
      return <Shield className="w-3 h-3 text-white fill-current" />;
    } else if (friendlyName.includes("door") || friendlyName.includes("tür") || friendlyName.includes("lock")) {
      return isOn ? <Unlock className="w-3 h-3 text-white fill-current" /> : <Lock className="w-3 h-3 text-white fill-current" />;
    } else if (friendlyName.includes("play") || friendlyName.includes("media") || friendlyName.includes("music")) {
      return isOn ? <Pause className="w-3 h-3 text-white fill-current" /> : <Play className="w-3 h-3 text-white fill-current" />;
    } else {
      return <Power className="w-3 h-3 text-white fill-current" />;
    }
  };

  // Get dynamic color based on entity type and state
  const getSwitchColor = () => {
    if (isUnavailable || !entityId) return "from-red-400 to-red-500";

    const domain = entityId.split(".")[0];
    const friendlyName = haEntity?.attributes?.friendly_name?.toLowerCase() || "";

    // Color based on entity type and state
    if (domain === "light" || friendlyName.includes("light") || friendlyName.includes("licht")) {
      return isOn ? "from-yellow-400 to-yellow-500" : "from-gray-400 to-gray-500";
    } else if (domain === "alarm_control_panel" || friendlyName.includes("alarm") || friendlyName.includes("security")) {
      return isOn ? "from-red-400 to-red-500" : "from-gray-400 to-gray-500";
    } else if (friendlyName.includes("door") || friendlyName.includes("tür") || friendlyName.includes("lock")) {
      return isOn ? "from-green-400 to-green-500" : "from-gray-400 to-gray-500";
    } else if (friendlyName.includes("play") || friendlyName.includes("media") || friendlyName.includes("music")) {
      return isOn ? "from-blue-400 to-blue-500" : "from-gray-400 to-gray-500";
    } else {
      return isOn ? "from-orange-400 to-orange-500" : "from-gray-400 to-gray-500";
    }
  };

  // Handle toggle functionality
  const handleToggle = async () => {
    if (isUnavailable || !haEntity || !entityId) return;

    try {
      const domain = entityId.split(".")[0];
      const service = isOn ? "turn_off" : "turn_on";
      await callService(domain, service, { entity_id: entityId });
    } catch (error) {
      console.error("Failed to toggle entity:", error);
    }
  };

  return (
    <Card
      title={showTitle ? title : ""}
      subtitle={showSubtitle ? getSubtitle() : ""}
      icon={showIcon ? getIcon() : undefined}
      onTitleChange={onTitleChange}
      onJsonSave={onJsonSave}
      onCardDelete={onCardDelete}
      cardConfig={cardConfig}
      entityId={entityId}
      className={`${getCardBackground()} ${className} cursor-pointer`}
      width={width}
      height={height}
      onClick={handleToggle}
    >
      {/* Modern active state visualization */}
      <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
        {isUnavailable ? (
          <AlertCircle className="w-4 h-4 text-red-400" />
        ) : (
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-full shadow-lg transition-all duration-300
              ${
                isOn
                  ? "bg-gradient-to-br from-green-800/20 to-green-900/20 scale-105 ring-2 ring-green-300/40"
                  : "bg-gradient-to-br from-red-800/20 to-red-900/20 scale-105 ring-2 ring-red-300/40"
              }
            `}
          >
            <span
              className={`block w-2 h-2 rounded-full transition-all duration-300
                ${isOn ? "bg-white/90 shadow-lg" : "bg-red-400/80 shadow-lg"}
              `}
            />
          </div>
        )}
      </div>
    </Card>
  );
};
