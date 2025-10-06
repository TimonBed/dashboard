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
import { RoomHeaderCard } from "./cards/RoomHeaderCard";
import { CalendarCard } from "./cards/CalendarCard";

interface DynamicDashboardProps {
  dashboard: Dashboard;
  onCardTitleChange?: (cardId: string, title: string, entityId?: string) => void;
}

export const DynamicDashboard: React.FC<DynamicDashboardProps> = ({ dashboard, onCardTitleChange }) => {
  // Flatten all cards from all sections and calculate grid dimensions
  const getAllCards = () => {
    const allCards: any[] = [];
    let maxX = 0;
    let maxY = 0;

    dashboard.columns.forEach((column) => {
      column.cards.forEach((roomSection) => {
        if (roomSection.type === "room-section") {
          roomSection.cards.forEach((card: any) => {
            allCards.push(card);
            maxX = Math.max(maxX, card.position.x + card.size.width);
            maxY = Math.max(maxY, card.position.y + card.size.height);
          });
        } else {
          allCards.push(roomSection);
          maxX = Math.max(maxX, (roomSection as any).position.x + (roomSection as any).size.width);
          maxY = Math.max(maxY, (roomSection as any).position.y + (roomSection as any).size.height);
        }
      });
    });

    return { allCards, maxX, maxY };
  };

  const { allCards, maxX, maxY } = getAllCards();

  const renderCard = (card: any) => {
    const commonProps = {
      title: card.title,
      entityId: card.entityId,
      onTitleChange: onCardTitleChange ? (title: string, entityId?: string) => onCardTitleChange(card.id, title, entityId) : undefined,
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
      "room-header": RoomHeaderCard,
      calendar: CalendarCard,
    };

    const CardComponent = cardComponents[card.type];
    if (!CardComponent) {
      console.warn(`Unknown card type: ${card.type} for card ID: ${card.id}`);
      return null;
    }

    const extraProps = {
      ...(card.type === "trash" && {
        entities: card.entities,
        showIcon: card.showIcon,
        showTitle: card.showTitle,
        showSubtitle: card.showSubtitle,
      }),
      ...(card.type === "uptime" && { uptimeSettings: card.uptimeSettings }),
      ...(card.type === "helios-ventilation" && { heliosSettings: card.heliosSettings }),
      ...(card.type === "button" && { vibrationDuration: card.vibrationDuration, iconName: card.iconName }),
      ...(card.type === "room-header" && { 
        icon: card.icon, 
        badges: card.badges,
        height: card.size?.height === 2 ? "h-32" : "h-16"
      }),
    };

    return (
      <div
        key={card.id}
        className="grid-item"
        style={{
          gridColumn: `${card.position.x + 1} / span ${card.size.width}`,
          gridRow: `${card.position.y + 1} / span ${card.size.height}`,
        }}
      >
        <CardComponent {...commonProps} {...extraProps} />
      </div>
    );
  };


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
      <div
        className="dashboard-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${maxX}, 1fr)`,
          gridTemplateRows: `repeat(${maxY}, 64px)`,
          gap: '8px',
          height: '100%',
        }}
      >
        {allCards.map((card) => renderCard(card))}
      </div>
    </div>
  );
};
