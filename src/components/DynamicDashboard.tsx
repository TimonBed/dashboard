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
import { Droplets, Thermometer, Lightbulb, FileText, Wind } from "lucide-react";

interface DynamicDashboardProps {
  dashboard: Dashboard;
  onCardTitleChange?: (cardId: string, title: string, entityId?: string) => void;
}

export const DynamicDashboard: React.FC<DynamicDashboardProps> = ({ dashboard, onCardTitleChange }) => {
  const { entities } = useHomeAssistantStore();

  // Get icon based on badge icon name
  const getIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      droplets: <Droplets className="w-4 h-4" />,
      thermometer: <Thermometer className="w-4 h-4" />,
      lightbulb: <Lightbulb className="w-4 h-4" />,
      filetext: <FileText className="w-4 h-4" />,
      "air-quality": <Wind className="w-4 h-4" />,
    };
    return iconMap[iconName] || <FileText className="w-4 h-4" />;
  };
  const renderCard = (card: any) => {
    const commonProps = {
      title: card.title,
      entityId: card.entityId,
      onTitleChange: onCardTitleChange ? (title: string, entityId?: string) => onCardTitleChange(card.id, title, entityId) : undefined,
    };

    // Get width and height classes based on card size
    const getSizeClasses = () => {
      const widthClass = card.size?.width === 2 ? "col-span-2" : "w-full";
      const heightClass = card.size?.height === 2 ? "row-span-2" : "";
      return `${widthClass} ${heightClass}`.trim();
    };

    const cardElement = (() => {
      switch (card.type) {
        case "light-switch":
          return <LightSwitchCard key={card.id} {...commonProps} />;
        case "sensor-state":
          return <SensorStateCard key={card.id} {...commonProps} />;
        case "button":
          return <ButtonCard key={card.id} {...commonProps} vibrationDuration={card.vibrationDuration} iconName={card.iconName} />;
        case "shutter":
          return <ShutterCard key={card.id} {...commonProps} />;
        case "trash":
          return (
            <TrashCard
              key={card.id}
              {...commonProps}
              entities={card.entities}
              height={card.size?.height === 2 ? "h-32" : "h-16"}
              showIcon={card.showIcon}
              showTitle={card.showTitle}
              showSubtitle={card.showSubtitle}
            />
          );
        case "time-remaining":
          return <TimeRemainingCard key={card.id} {...commonProps} showIcon={card.showIcon} showTitle={card.showTitle} showSubtitle={card.showSubtitle} />;
        case "binary-switch":
          return <BinarySwitchCard key={card.id} {...commonProps} showIcon={card.showIcon} showTitle={card.showTitle} showSubtitle={card.showSubtitle} />;
        case "person":
          return <PersonCard key={card.id} {...commonProps} showIcon={card.showIcon} showTitle={card.showTitle} showSubtitle={card.showSubtitle} />;
        case "uptime":
          return <UptimeCard key={card.id} {...commonProps} uptimeSettings={card.uptimeSettings} />;
        case "helios-ventilation":
          return <HeliosVentilationCard key={card.id} {...commonProps} heliosSettings={card.heliosSettings} />;
        case "bus-departure":
          return <BusDepartureCard key={card.id} {...commonProps} maxDepartures={card.maxDepartures} />;
        default:
          return null;
      }
    })();

    return cardElement ? (
      <div key={card.id} className={getSizeClasses()}>
        {cardElement}
      </div>
    ) : null;
  };

  return (
    <div
      className={`min-h-screen p-6`}
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
          : dashboard.backgroundColor === "bg-gray-900"
          ? "#111827"
          : dashboard.backgroundColor === "bg-black"
          ? "#000000"
          : undefined,
      }}
    >
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">{dashboard.title}</h1>
        {dashboard.description && <p className="text-gray-300">{dashboard.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {dashboard.columns.map((column) => {
          // Generate responsive grid classes for cards
          const getGridClasses = () => {
            if (!column.gridColumns) return "grid-cols-1";

            const classes: string[] = [];
            if (column.gridColumns.sm) classes.push(`sm:grid-cols-${column.gridColumns.sm}`);
            if (column.gridColumns.md) classes.push(`md:grid-cols-${column.gridColumns.md}`);
            if (column.gridColumns.lg) classes.push(`lg:grid-cols-${column.gridColumns.lg}`);
            if (column.gridColumns.xl) classes.push(`xl:grid-cols-${column.gridColumns.xl}`);

            return classes.length > 0 ? `grid grid-cols-1 ${classes.join(" ")}` : "grid grid-cols-1";
          };

          return (
            <div key={column.id} className="w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">{column.title}</h2>

                {/* Sensor data on the right */}
                {column.badges && column.badges.length > 0 && (
                  <div className="flex items-center space-x-4">
                    {column.badges.map((badge) => {
                      const entity = entities.get(badge.entityId);
                      if (!entity) return null;

                      const state = entity.state;
                      const attributes = entity.attributes || {};
                      const unit = attributes.unit_of_measurement || "";

                      // Format the value based on the sensor type
                      let displayValue = state;
                      if (badge.entityId.includes("temperature") || badge.entityId.includes("temp")) {
                        displayValue = `${parseFloat(state).toFixed(1)}°C`;
                      } else if (badge.entityId.includes("humidity")) {
                        displayValue = `${parseFloat(state).toFixed(1)}%`;
                      } else if (badge.entityId.includes("light") || badge.entityId.includes("brightness")) {
                        displayValue = state === "on" ? "1" : "0";
                      } else if (unit) {
                        displayValue = `${state} ${unit}`;
                      }

                      return (
                        <div key={badge.id} className="flex items-center space-x-1 text-gray-300">
                          {getIcon(badge.icon)}
                          <span className="text-sm">{displayValue}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className={`${getGridClasses()} gap-4 auto-rows-min`}>{column.cards.map((card) => renderCard(card))}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
