import React from "react";
import { Dashboard } from "../types/dashboard";
import { LightSwitchCard } from "./cards/LightSwitchCard";
import { SensorStateCard } from "./cards/SensorStateCard";
import { ButtonCard } from "./cards/ButtonCard";
import { ShutterCard } from "./cards/ShutterCard";
import { TrashCard } from "./cards/TrashCard";
import { TimeRemainingCard } from "./cards/TimeRemainingCard";
import { BinarySwitchCard } from "./cards/BinarySwitchCard";
import { PersonCard } from "./cards/PersonCard";
import { UptimeCard } from "./cards/UptimeCard";
import { HeliosVentilationCard } from "./cards/HeliosVentilationCard";
import { BusDepartureCard } from "./cards/BusDepartureCard";
import { useHomeAssistantStore } from "../store/useHomeAssistantStore";
import { Droplets, Thermometer, Lightbulb, FileText, Wind, Bed, ChefHat, Bath, Printer, Sofa, Info, Sun } from "lucide-react";

interface DynamicDashboardProps {
  dashboard: Dashboard;
  onCardTitleChange?: (cardId: string, title: string, entityId?: string) => void;
}

export const DynamicDashboard: React.FC<DynamicDashboardProps> = ({ dashboard, onCardTitleChange }) => {
  const { entities } = useHomeAssistantStore();

  const getIcon = (iconName: string) => {
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

  const renderCard = (card: any) => {
    const commonProps = {
      title: card.title,
      entityId: card.entityId,
      onTitleChange: onCardTitleChange ? (title: string, entityId?: string) => onCardTitleChange(card.id, title, entityId) : undefined,
    };

    const getSizeClasses = () => {
      if (dashboard.layout === "masonry") return "w-full h-full";
      const widthClass = card.size?.width === 2 ? "col-span-2" : "w-full";
      return widthClass;
    };

    const cardComponents: { [key: string]: React.ComponentType<any> } = {
      "light-switch": LightSwitchCard,
      "sensor-state": SensorStateCard,
      button: ButtonCard,
      shutter: ShutterCard,
      trash: TrashCard,
      "time-remaining": TimeRemainingCard,
      "binary-switch": BinarySwitchCard,
      person: PersonCard,
      uptime: UptimeCard,
      "helios-ventilation": HeliosVentilationCard,
      "bus-departure": BusDepartureCard,
    };

    const CardComponent = cardComponents[card.type];
    if (!CardComponent) {
      console.warn(`Unknown card type: ${card.type} for card ID: ${card.id}`);
      return null;
    }

    const extraProps = {
      ...(card.type === "trash" && {
        entities: card.entities,
        height: card.size?.height === 2 ? "h-32" : "h-16",
        showIcon: card.showIcon,
        showTitle: card.showTitle,
        showSubtitle: card.showSubtitle,
      }),
      ...(card.type === "uptime" && { uptimeSettings: card.uptimeSettings }),
      ...(card.type === "helios-ventilation" && { heliosSettings: card.heliosSettings }),
      ...(card.type === "bus-departure" && { maxDepartures: card.maxDepartures }),
      ...(card.type === "button" && { vibrationDuration: card.vibrationDuration, iconName: card.iconName }),
    };

    return (
      <div key={card.id} className={getSizeClasses()}>
        <CardComponent {...commonProps} {...extraProps} />
      </div>
    );
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

  const renderSectionHeader = (section: any) => (
    <div className="flex items-end justify-between mb-4 h-16 pb-2">
      <div className="flex items-center space-x-2">
        {section.icon && getIcon(section.icon)}
        <h2 className="text-xl font-semibold text-white">{section.title}</h2>
      </div>
      {section.badges?.length > 0 && <div className="flex items-center space-x-4">{section.badges.map(formatSensorValue)}</div>}
    </div>
  );

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: dashboard.backgroundColor?.startsWith("#")
          ? dashboard.backgroundColor
          : dashboard.backgroundColor?.includes("gradient")
          ? (() => {
              const colors = dashboard.backgroundColor.replace("gradient: ", "").split(", ");
              return `linear-gradient(135deg, ${colors.join(", ")})`;
            })()
          : dashboard.backgroundColor === "bg-gray-950"
          ? "#030712"
          : "#0f0f0f",
      }}
    >
      <div className="grid grid-cols-2 gap-6">
        {dashboard.columns.map((column) => (
          <div key={column.id} className="space-y-2">
            {column.cards.map((roomSection) => {
              if (roomSection.type === "room-section") {
                return (
                  <div key={roomSection.id} className="space-y-1.5">
                    {renderSectionHeader(roomSection)}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                      {roomSection.cards.map((card) => (
                        <div key={card.id} className={card.size?.width === 2 ? "col-span-2" : "col-span-1"}>
                          {renderCard(card)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <div key={roomSection.id} className="space-y-2">
                  {renderCard(roomSection)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
