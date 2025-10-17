import React from "react";
import { Card } from "./Card";
import { useHomeAssistantStore } from "../../store/useHomeAssistantStore";
import { Droplets, Thermometer, Lightbulb, FileText, Wind, Bed, ChefHat, Bath, Printer, Sofa, Info, Sun } from "lucide-react";
import { CardComponentProps } from "../../types/cardProps";

interface RoomHeaderCardSpecificProps {
  title: string;
  icon?: string;
  badges?: Array<{
    id: string;
    entityId: string;
    icon: string;
  }>;
  width?: string;
  height?: string;
}

export type RoomHeaderCardProps = CardComponentProps<RoomHeaderCardSpecificProps>;

export const RoomHeaderCard: React.FC<RoomHeaderCardProps> = ({
  title,
  icon,
  badges = [],
  onTitleChange,
  onJsonSave,
  onCardDelete,
  cardConfig,
  entityId,
  className = "",
  width = "w-full",
  height = "h-16",
}) => {
  const { entities } = useHomeAssistantStore();

  const getIcon = (iconName: string) => {
    // Check if iconName is a URL
    const isUrl =
      iconName &&
      (iconName.startsWith("http://") ||
        iconName.startsWith("https://") ||
        iconName.endsWith(".jpg") ||
        iconName.endsWith(".jpeg") ||
        iconName.endsWith(".png") ||
        iconName.endsWith(".svg") ||
        iconName.endsWith(".webp") ||
        iconName.endsWith(".gif"));

    if (isUrl) {
      return <img src={iconName} alt="Icon" className="w-4 h-4 object-contain" />;
    }

    const iconMap: { [key: string]: React.ReactNode } = {
      droplets: <Droplets className="w-4 h-4" />,
      thermometer: <Thermometer className="w-4 h-4" />,
      lightbulb: <Lightbulb className="w-4 h-4" />,
      filetext: <FileText className="w-4 h-4" />,
      "air-quality": <Wind className="w-4 h-4" />,
      bed: <Bed className="w-4 h-4" />,
      "chef-hat": <ChefHat className="w-4 h-4" />,
      bath: <Bath className="w-4 h-4" />,
      printer: <Printer className="w-4 h-4" />,
      sofa: <Sofa className="w-4 h-4" />,
      info: <Info className="w-4 h-4" />,
      sun: <Sun className="w-4 h-4" />,
    };
    return iconMap[iconName] || <FileText className="w-4 h-4" />;
  };

  const formatSensorValue = (badge: any) => {
    const entity = entities.get(badge.entityId);
    if (!entity) return null;

    const state = entity.state;
    const unit = entity.attributes?.unit_of_measurement || "";

    let displayValue = state;
    if (badge.entityId.includes("temperature") || badge.entityId.includes("temp")) {
      displayValue = `${parseFloat(state).toFixed(1)}°C`;
    } else if (badge.entityId.includes("humidity")) {
      displayValue = `${parseFloat(state).toFixed(1)}%`;
    } else if (unit) {
      displayValue = `${state} ${unit}`;
    }

    return (
      <div key={badge.id} className="flex items-center space-x-1 text-gray-300">
        {getIcon(badge.icon)}
        <span className="text-sm">{displayValue}</span>
      </div>
    );
  };

  return (
    <div className={`w-full ${height} ${className}`}>
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center space-x-2">
          {icon && getIcon(icon)}
          <h2 className="text-xl font-semibold text-white">{title}</h2>
        </div>
        {badges.length > 0 && <div className="flex items-center space-x-4">{badges.map(formatSensorValue)}</div>}
      </div>
    </div>
  );
};
