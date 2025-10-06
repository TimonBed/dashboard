import React, { memo, useMemo } from "react";
import { Trash2 } from "lucide-react";
import { Card } from "./Card";
import { useHomeAssistantStore } from "../../store/useHomeAssistantStore";
import Badge from "../ui/Badge";

export interface TrashCardProps {
  title: string;
  entities: Array<{ entity: string }>;
  onTitleChange?: (newTitle: string) => void;
  className?: string;
  width?: string;
  height?: string;
  showIcon?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
}

const TrashCardComponent: React.FC<TrashCardProps> = ({
  title,
  entities,
  onTitleChange,
  width = "w-full",
  height = "h-full",
  showIcon = true,
  showTitle = true,
  showSubtitle = true,
}) => {
  const { entities: haEntities } = useHomeAssistantStore();

  // Get trash collection data - memoized to prevent recalculation
  const trashData = useMemo(() => {
    return entities
      .map(({ entity }) => {
        const haEntity = haEntities.get(entity);
        if (!haEntity) return null;

        const state = haEntity.state;
        const attributes = haEntity.attributes || {};
        const friendlyName = attributes.friendly_name || entity.split(".").pop() || "Unknown";
        const entityPicture = attributes.entity_picture;
        const daysTo = attributes.daysTo;
        const lastChanged = haEntity.last_changed;

        return {
          entity,
          state,
          friendlyName,
          entityPicture,
          daysTo: typeof daysTo === "number" ? daysTo : null,
          lastChanged,
          isUnavailable: state === "unavailable",
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [entities, haEntities]);

  // Get the next collection (lowest daysTo) - memoized
  const nextCollection = useMemo(() => {
    const availableItems = trashData.filter((item) => !item.isUnavailable && item.daysTo !== null);

    if (availableItems.length === 0) return null;

    return availableItems.reduce((next, current) => {
      const nextDays = next.daysTo ?? Infinity;
      const currentDays = current.daysTo ?? Infinity;
      return currentDays < nextDays ? current : next;
    });
  }, [trashData]);

  // Get subtitle text - memoized
  const subtitle = useMemo(() => {
    if (!nextCollection) {
      const unavailableCount = trashData.filter((item) => item.isUnavailable).length;
      if (unavailableCount > 0) return `${unavailableCount} unavailable`;
      return "No data";
    }

    const days = nextCollection.daysTo;
    if (days === null) return "No data";
    if (days === 0) return "Heute";
    if (days === 1) return "Morgen";
    if (days === 2) return "Übermorgen";
    return `in ${days} Tagen`;
  }, [nextCollection, trashData]);

  // Get badge variant for trash collection
  const getBadgeVariant = (item: any) => {
    if (item.isUnavailable) return "red";
    if (item.daysTo === 0) return "red";
    if (item.daysTo === 1) return "orange";
    if (item.daysTo !== null && item.daysTo <= 3) return "yellow";
    return "green";
  };

  // Use memoized data

  return (
    <Card
      title={showTitle ? title : ""}
      subtitle={showSubtitle ? subtitle : ""}
      icon={showIcon ? <Trash2 className="w-5 h-5" /> : undefined}
      onTitleChange={onTitleChange}
      width={width}
      height={height}
    >
      {/* All trash collections in horizontal stack */}
      <div className="absolute h-full top-1/2 left-0 right-0 transform -translate-y-1/2 flex items-center justify-between px-8">
        {trashData.map((item, index) => {
          if (!item) return null;

          return (
            <div key={index} className="flex flex-col items-center space-y-1.5">
              <span className="truncate text-gray-400 text-sm font-bold">{item.friendlyName}</span>
              {item.entityPicture && <img src={item.entityPicture} alt={item.friendlyName} className="w-10 h-10 object-contain rounded-lg" />}
              <div className="flex flex-col items-center text-xs">
                <Badge variant={getBadgeVariant(item)} className="mt-1">
                  {item.isUnavailable
                    ? "N/A"
                    : item.daysTo === 0
                    ? "Heute"
                    : item.daysTo === 1
                    ? "Morgen"
                    : item.daysTo === 2
                    ? "Übermorgen"
                    : item.daysTo !== null
                    ? `in ${item.daysTo} Tagen`
                    : item.state}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const TrashCard = memo(TrashCardComponent);
