import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, X, Save, AlertCircle, Settings } from "lucide-react";
import { Dashboard, DashboardCard } from "../types/dashboard";
import { getCardRequirements, validateCardConfig } from "../types/cardRequirements";
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
import { WeatherCard } from "./cards/WeatherCard";
import { LinkCard } from "./cards/LinkCard";
import { PlantSensorCard } from "./cards/PlantSensorCard";
import { Card, CardErrorBoundary } from "./cards/Card";
import { dashboardService } from "../services/dashboardService";

interface DynamicDashboardProps {
  dashboard: Dashboard;
  onCardTitleChange?: (cardId: string, title: string, entityId?: string) => void;
  onCardJsonSave?: (cardId: string, config: any) => void;
  onNotification?: (message: string) => void;
}

export const DynamicDashboard: React.FC<DynamicDashboardProps> = ({ dashboard, onCardTitleChange, onCardJsonSave, onNotification }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(location.search);
  const isEditMode = urlParams.get("edit") === "true";

  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showDashboardSettingsModal, setShowDashboardSettingsModal] = useState(false);
  const [dashboardSettings, setDashboardSettings] = useState({
    title: dashboard.title,
    icon: dashboard.icon || "",
    backgroundColor: dashboard.backgroundColor || "bg-gray-900",
    minColumns: dashboard.minColumns || 12,
    minRows: dashboard.minRows || 10,
  });
  const [newCardType, setNewCardType] = useState<string>("button");
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardEntityId, setNewCardEntityId] = useState("");
  const [newCardPosition, setNewCardPosition] = useState({ x: 0, y: 0 });
  const [newCardSize, setNewCardSize] = useState({ width: 2, height: 2 });
  const [newCardExtraFields, setNewCardExtraFields] = useState<Record<string, any>>({});
  const [resizingCard, setResizingCard] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [currentResizeSize, setCurrentResizeSize] = useState<{ width: number; height: number } | null>(null);
  const [draggingCard, setDraggingCard] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [dragPreviewPosition, setDragPreviewPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

  // Long press to toggle edit mode
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    // Apply minimum columns and rows from dashboard settings
    maxX = Math.max(maxX, dashboard.minColumns || 0);
    maxY = Math.max(maxY, dashboard.minRows || 0);

    return { allCards, maxX, maxY };
  };

  const { allCards, maxX, maxY } = getAllCards();

  // Check if a grid cell is occupied by any card
  const isCellOccupied = (x: number, y: number): boolean => {
    return allCards.some((card) => {
      const cardStartX = card.position.x;
      const cardEndX = card.position.x + card.size.width;
      const cardStartY = card.position.y;
      const cardEndY = card.position.y + card.size.height;
      return x >= cardStartX && x < cardEndX && y >= cardStartY && y < cardEndY;
    });
  };

  const handleEmptyCellClick = (x: number, y: number) => {
    setNewCardPosition({ x, y });
    setShowAddCardModal(true);
  };

  const handleCardDelete = async (cardId: string) => {
    // Find and remove the card from the dashboard
    const updatedDashboard = { ...dashboard };

    for (const column of updatedDashboard.columns) {
      for (let i = 0; i < column.cards.length; i++) {
        const item = column.cards[i];

        // Check if it's the card directly
        if (item.id === cardId) {
          column.cards.splice(i, 1);
          break;
        }

        // Check if it's in a room section
        if (item.type === "room-section") {
          const cardIndex = item.cards.findIndex((c: any) => c.id === cardId);
          if (cardIndex !== -1) {
            item.cards.splice(cardIndex, 1);
            break;
          }
        }
      }
    }

    // Save to file
    await dashboardService.updateDashboard(dashboard.id, updatedDashboard);
    await dashboardService.saveDashboardToFile(dashboard.id, updatedDashboard);

    // Show notification
    if (onNotification) {
      onNotification(`Card deleted successfully`);
    }

    // Reload page to reflect changes
    window.location.reload();
  };

  const handleSaveDashboardSettings = async () => {
    // Update dashboard with new settings
    const updatedDashboard = {
      ...dashboard,
      title: dashboardSettings.title,
      icon: dashboardSettings.icon,
      backgroundColor: dashboardSettings.backgroundColor,
      minColumns: dashboardSettings.minColumns,
      minRows: dashboardSettings.minRows,
      updatedAt: new Date().toISOString(),
    };

    // Save to file
    await dashboardService.updateDashboard(dashboard.id, updatedDashboard);
    await dashboardService.saveDashboardToFile(dashboard.id, updatedDashboard);

    // Show notification
    if (onNotification) {
      onNotification(`Dashboard settings saved successfully`);
    }

    setShowDashboardSettingsModal(false);

    // Reload page to reflect changes
    window.location.reload();
  };

  // Long press handlers for toggling edit mode
  const handleLongPressStart = (e: React.MouseEvent | React.TouchEvent) => {
    // Don't start long press if clicking on a card or if already in a modal
    const target = e.target as HTMLElement;
    if (target.closest("[data-card-id]") || target.closest(".resize-handle") || showAddCardModal || showDashboardSettingsModal) {
      return;
    }

    // Set timer for 5 seconds
    longPressTimerRef.current = setTimeout(() => {
      handleToggleEditMode();
      handleLongPressEnd();
    }, 2000);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleToggleEditMode = () => {
    const newPath = isEditMode ? location.pathname : `${location.pathname}?edit=true`;

    navigate(newPath);

    if (onNotification) {
      onNotification(isEditMode ? "Edit mode disabled" : "Edit mode enabled - Hold background for 5s to disable");
    }
  };

  // Update browser title
  useEffect(() => {
    if (dashboard?.title) {
      document.title = dashboard.title;
    }
    return () => {
      document.title = "HA Dashboard";
    };
  }, [dashboard?.title]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const cardTypeOptions = [
    { value: "button", label: "Button" },
    { value: "light-switch", label: "Light Switch" },
    { value: "sensor-state", label: "Sensor State" },
    { value: "binary-switch", label: "Binary Switch" },
    { value: "shutter", label: "Shutter" },
    { value: "trash", label: "Trash Schedule" },
    { value: "time-remaining", label: "Time Remaining" },
    { value: "person", label: "Person" },
    { value: "uptime", label: "Uptime" },
    { value: "helios-ventilation", label: "Helios Ventilation" },
    { value: "bus-departure", label: "Bus Departure" },
    { value: "room-header", label: "Room Header" },
    { value: "calendar", label: "Calendar" },
    { value: "weather", label: "Weather" },
    { value: "link", label: "Link" },
    { value: "plant-sensor", label: "Plant Sensor" },
  ];

  const handleAddCard = async () => {
    if (!newCardTitle.trim()) return;

    const newCard: DashboardCard = {
      id: `card-${Date.now()}`,
      type: newCardType as any,
      title: newCardTitle,
      entityId: newCardEntityId || undefined,
      position: newCardPosition,
      size: newCardSize,
      ...newCardExtraFields,
    };

    // Validate required fields
    const validation = validateCardConfig(newCardType, newCard);
    if (!validation.isValid) {
      if (onNotification) {
        onNotification(`⚠️ Missing required fields: ${validation.missingFields.join(", ")}`);
      }
      return;
    }

    // Add card to first column's first section (or create a new section)
    const updatedDashboard = { ...dashboard };
    if (updatedDashboard.columns.length > 0) {
      if (updatedDashboard.columns[0].cards.length > 0) {
        const firstItem = updatedDashboard.columns[0].cards[0];
        if (firstItem.type === "room-section") {
          firstItem.cards.push(newCard);
        } else {
          // Create a new room section
          updatedDashboard.columns[0].cards.push({
            id: `section-${Date.now()}`,
            type: "room-section",
            cards: [newCard],
            position: { x: 0, y: maxY },
            size: { width: maxX, height: newCardSize.height },
          } as any);
        }
      } else {
        // Add to empty column
        updatedDashboard.columns[0].cards.push(newCard as any);
      }
    }

    // Save to file
    await dashboardService.updateDashboard(dashboard.id, updatedDashboard);
    await dashboardService.saveDashboardToFile(dashboard.id, updatedDashboard);

    // Reset form
    setShowAddCardModal(false);
    setNewCardTitle("");
    setNewCardEntityId("");
    setNewCardType("button");
    setNewCardPosition({ x: 0, y: 0 });
    setNewCardSize({ width: 2, height: 2 });
    setNewCardExtraFields({});

    // Reload page to show new card
    window.location.reload();
  };

  const handleResizeStart = (cardId: string, currentWidth: number, currentHeight: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingCard(cardId);
    setResizeStart({ x: e.clientX, y: e.clientY, width: currentWidth, height: currentHeight });
    setCurrentResizeSize({ width: currentWidth, height: currentHeight });
  };

  const handleDragStart = (cardId: string, e: React.MouseEvent) => {
    // Only handle left-click (button 0), ignore right-click (button 2)
    if (e.button !== 0) {
      return;
    }

    // Don't start drag if clicking on resize handle
    if ((e.target as HTMLElement).closest(".resize-handle")) {
      return;
    }

    // Don't start drag if a modal/popup is open (settings menu, add card modal, etc.)
    const hasOpenModal = document.querySelector('[class*="fixed"][class*="inset-0"][class*="bg-black"]');
    if (hasOpenModal) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const card = allCards.find((c) => c.id === cardId);
    if (!card) return;

    setDraggingCard(cardId);

    // Calculate offset from card's grid position to mouse position
    const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
    if (cardElement) {
      const rect = cardElement.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }

    setDragPreviewPosition({ x: card.position.x, y: card.position.y });
  };

  // Mouse move and up event listeners for resizing
  React.useEffect(() => {
    if (!resizingCard || !resizeStart) return;

    const handleMove = (e: MouseEvent) => {
      const card = allCards.find((c) => c.id === resizingCard);
      if (!card) return;

      // Calculate pixel movement
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      // Get grid cell size
      const gridElement = document.querySelector(".dashboard-grid");
      if (!gridElement) return;

      const gridWidth = gridElement.clientWidth;
      const cellWidth = gridWidth / maxX;
      const cellHeight = 64;

      // Account for CSS grid gap (8px) in calculations
      const effectiveCellWidth = cellWidth + 8; // cellWidth + gap
      const effectiveCellHeight = cellHeight + 8; // cellHeight + gap

      // Calculate new size in grid units
      const newWidth = Math.max(1, Math.round((resizeStart.width * effectiveCellWidth + deltaX) / effectiveCellWidth));
      const newHeight = Math.max(1, Math.round((resizeStart.height * effectiveCellHeight + deltaY) / effectiveCellHeight));

      // Update live size indicator
      setCurrentResizeSize({ width: newWidth, height: newHeight });

      // Update card size visually
      const cardElement = document.querySelector(`[data-card-id="${resizingCard}"]`);
      if (cardElement) {
        (cardElement as HTMLElement).style.gridColumn = `${card.position.x + 1} / span ${newWidth}`;
        (cardElement as HTMLElement).style.gridRow = `${card.position.y + 1} / span ${newHeight}`;
      }
    };

    const handleUp = async () => {
      const card = allCards.find((c) => c.id === resizingCard);
      if (!card) {
        setResizingCard(null);
        setResizeStart(null);
        setCurrentResizeSize(null);
        return;
      }

      // Get final size from DOM
      const cardElement = document.querySelector(`[data-card-id="${resizingCard}"]`);
      if (cardElement) {
        const gridColumn = (cardElement as HTMLElement).style.gridColumn;
        const gridRow = (cardElement as HTMLElement).style.gridRow;

        const widthMatch = gridColumn.match(/span (\d+)/);
        const heightMatch = gridRow.match(/span (\d+)/);

        if (widthMatch && heightMatch) {
          const newWidth = parseInt(widthMatch[1]);
          const newHeight = parseInt(heightMatch[1]);

          // Update card size in dashboard
          card.size.width = newWidth;
          card.size.height = newHeight;

          // Save to file
          const updatedDashboard = { ...dashboard };
          await dashboardService.updateDashboard(dashboard.id, updatedDashboard);
          await dashboardService.saveDashboardToFile(dashboard.id, updatedDashboard);

          // Show notification
          if (onNotification) {
            onNotification(`Card resized to ${newWidth}x${newHeight}`);
          }
        }
      }

      setResizingCard(null);
      setResizeStart(null);
      setCurrentResizeSize(null);
    };

    document.body.style.cursor = "se-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [resizingCard, resizeStart, allCards, maxX, dashboard, onNotification]);

  // Mouse move and up event listeners for dragging
  React.useEffect(() => {
    if (!draggingCard || !dragOffset) return;

    const handleDragMove = (e: MouseEvent) => {
      const gridElement = document.querySelector(".dashboard-grid");
      if (!gridElement) return;

      const gridRect = gridElement.getBoundingClientRect();
      const gridWidth = gridRect.width;
      const cellWidth = gridWidth / maxX;
      const cellHeight = 64;

      // Calculate which grid cell the mouse is over
      const mouseX = e.clientX - gridRect.left;
      const mouseY = e.clientY - gridRect.top;

      // Account for CSS grid gap (8px) in calculations
      const effectiveCellWidth = cellWidth + 8; // cellWidth + gap
      const effectiveCellHeight = cellHeight + 8; // cellHeight + gap

      const gridX = Math.floor(mouseX / effectiveCellWidth);
      const gridY = Math.floor(mouseY / effectiveCellHeight);

      // Clamp to grid boundaries
      const clampedX = Math.max(0, Math.min(gridX, maxX - 1));
      const clampedY = Math.max(0, Math.min(gridY, maxY - 1));

      setDragPreviewPosition({ x: clampedX, y: clampedY });
    };

    const handleDragEnd = async () => {
      const card = allCards.find((c) => c.id === draggingCard);
      if (!card || !dragPreviewPosition) {
        setDraggingCard(null);
        setDragOffset(null);
        setDragPreviewPosition(null);
        return;
      }

      // Update card position
      card.position.x = dragPreviewPosition.x;
      card.position.y = dragPreviewPosition.y;

      // Save to file
      const updatedDashboard = { ...dashboard };
      await dashboardService.updateDashboard(dashboard.id, updatedDashboard);
      await dashboardService.saveDashboardToFile(dashboard.id, updatedDashboard);

      // Show notification
      if (onNotification) {
        onNotification(`Card moved to position ${dragPreviewPosition.x}, ${dragPreviewPosition.y}`);
      }

      setDraggingCard(null);
      setDragOffset(null);
      setDragPreviewPosition(null);
    };

    document.body.style.cursor = "move";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
    };
  }, [draggingCard, dragOffset, dragPreviewPosition, allCards, maxX, maxY, dashboard, onNotification]);

  const renderCard = (card: any) => {
    const commonProps = {
      title: card.title,
      entityId: card.entityId,
      cardConfig: card,
      onTitleChange: onCardTitleChange ? (title: string, entityId?: string) => onCardTitleChange(card.id, title, entityId) : undefined,
      onJsonSave: onCardJsonSave ? (config: any) => onCardJsonSave(card.id, config) : undefined,
      onCardDelete: () => handleCardDelete(card.id),
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
      weather: WeatherCard,
      link: LinkCard,
      "plant-sensor": PlantSensorCard,
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
        height: card.size?.height === 2 ? "h-32" : "h-16",
      }),
      ...(card.type === "weather" && { zipCode: card.zipCode }),
      ...(card.type === "link" && { url: card.url, subtitle: card.subtitle, icon: card.icon }),
      ...(card.type === "time-remaining" && { remainingTimeEntityId: card.remainingTimeEntityId }),
      ...(card.type === "plant-sensor" && {
        plants: card.plants,
        batteryEntity: card.batteryEntity,
        humidityEntity: card.humidityEntity,
        moistureEntity: card.moistureEntity,
        temperatureEntity: card.temperatureEntity,
        image: card.image,
      }),
    };

    const isDragging = draggingCard === card.id;

    return (
      <div
        key={card.id}
        data-card-id={card.id}
        className={`grid-item relative ${isEditMode ? "cursor-move" : ""} ${isDragging ? "opacity-50" : ""}`}
        style={{
          gridColumn: `${card.position.x + 1} / span ${card.size.width}`,
          gridRow: `${card.position.y + 1} / span ${card.size.height}`,
          transition: isDragging ? "none" : "all 0.2s ease",
        }}
        onMouseDown={isEditMode ? (e) => handleDragStart(card.id, e) : undefined}
      >
        <CardErrorBoundary
          fallback={
            <Card
              title={card.title || "Card"}
              subtitle="Render error"
              icon={<AlertCircle className="w-5 h-5 text-red-400" />}
              entityId={card.entityId}
              onTitleChange={commonProps.onTitleChange}
              onJsonSave={commonProps.onJsonSave}
              onCardDelete={commonProps.onCardDelete}
              cardConfig={card}
              height="h-full"
            >
              <div className="flex items-center justify-between h-full">
                <div className="text-red-400 text-sm font-semibold">This card failed to render</div>
                <div className="text-xs text-gray-400 opacity-80">Right click → JSON</div>
              </div>
            </Card>
          }
        >
          <CardComponent {...commonProps} {...extraProps} />
        </CardErrorBoundary>

        {/* Resize Handle (only in edit mode) */}
        {isEditMode && (
          <>
            <div
              className="resize-handle absolute bottom-0 right-0 w-8 h-8 bg-blue-500/80 cursor-se-resize rounded-tl-xl flex items-center justify-center hover:bg-blue-600 transition-all duration-200 hover:scale-110 z-50 shadow-lg"
              onMouseDown={(e) => handleResizeStart(card.id, card.size.width, card.size.height, e)}
              title="Drag to resize"
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 19L19 9M15 19L19 15" strokeLinecap="round" />
              </svg>
            </div>

            {/* Size indicator badge */}
            {resizingCard === card.id && currentResizeSize && (
              <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg z-50 animate-pulse">
                {currentResizeSize.width} × {currentResizeSize.height}
              </div>
            )}

            {/* Position indicator badge when dragging */}
            {isDragging && dragPreviewPosition && (
              <div className="absolute top-2 left-2 bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg z-50 animate-pulse">
                {dragPreviewPosition.x}, {dragPreviewPosition.y}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <>
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
          className={`dashboard-grid ${isEditMode ? "edit-mode-grid" : ""}`}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${maxX}, 1fr)`,
            gridTemplateRows: `repeat(${maxY}, 64px)`,
            gap: "8px",
            height: "100%",
            position: "relative",
          }}
          onMouseDown={handleLongPressStart}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          onTouchStart={handleLongPressStart}
          onTouchEnd={handleLongPressEnd}
        >
          {/* Grid overlay for edit mode */}
          {isEditMode && (
            <div
              className="absolute inset-0"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${maxX}, 1fr)`,
                gridTemplateRows: `repeat(${maxY}, 64px)`,
                gap: "8px",
                pointerEvents: "none",
              }}
            >
              {Array.from({ length: maxX * maxY }).map((_, index) => {
                const cellX = index % maxX;
                const cellY = Math.floor(index / maxX);
                const isOccupied = isCellOccupied(cellX, cellY);
                const isHovered = hoveredCell?.x === cellX && hoveredCell?.y === cellY;

                return (
                  <div
                    key={index}
                    className={`border border-blue-400/30 bg-blue-500/5 rounded transition-all duration-200 ${
                      !isOccupied ? "pointer-events-auto cursor-pointer hover:bg-green-500/20 hover:border-green-400/50" : "pointer-events-none"
                    }`}
                    style={{
                      gridColumn: `${cellX + 1}`,
                      gridRow: `${cellY + 1}`,
                    }}
                    onMouseEnter={() => !isOccupied && setHoveredCell({ x: cellX, y: cellY })}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => !isOccupied && handleEmptyCellClick(cellX, cellY)}
                  >
                    {!isOccupied && isHovered && (
                      <div className="flex items-center justify-center h-full">
                        <Plus className="w-8 h-8 text-green-400" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Drag preview overlay */}
          {draggingCard && dragPreviewPosition && (
            <div
              className="absolute pointer-events-none z-40"
              style={{
                gridColumn: `${dragPreviewPosition.x + 1} / span ${allCards.find((c) => c.id === draggingCard)?.size.width || 1}`,
                gridRow: `${dragPreviewPosition.y + 1} / span ${allCards.find((c) => c.id === draggingCard)?.size.height || 1}`,
                border: "3px dashed #10b981",
                borderRadius: "12px",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
              }}
            />
          )}

          {allCards.map((card) => renderCard(card))}
        </div>

        {/* Edit Mode Indicator & Add Card Button */}
        {isEditMode && (
          <>
            <button
              onClick={() => setShowDashboardSettingsModal(true)}
              className="fixed top-4 right-4 bg-yellow-500/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-40 hover:bg-yellow-600/90 transition-all duration-200 hover:scale-105 cursor-pointer group"
              title="Dashboard Settings"
            >
              <Settings className="w-4 h-4 text-black" />
              <span className="text-black font-medium text-sm">Edit Mode</span>
              <div className="absolute top-full mt-2 right-0 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                Click to edit dashboard settings
              </div>
            </button>
            <button
              onClick={() => setShowAddCardModal(true)}
              className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110 z-40 group"
              title="Add Card"
            >
              <Plus className="w-6 h-6" />
              <div className="absolute right-full mr-4 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                Add New Card
              </div>
            </button>
          </>
        )}
      </div>

      {/* Add Card Modal */}
      {showAddCardModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl w-[600px] max-w-[90vw] p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Plus className="w-6 h-6 text-blue-400" />
                Add New Card
              </h2>
              <button
                onClick={() => setShowAddCardModal(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Card Type</label>
                <select
                  value={newCardType}
                  onChange={(e) => {
                    setNewCardType(e.target.value);
                    setNewCardExtraFields({});
                  }}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                >
                  {cardTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Required Fields Info */}
              {(() => {
                const requirements = getCardRequirements(newCardType);
                if (requirements && requirements.requiredFields.length > 0) {
                  return (
                    <div className="p-4 rounded-xl border bg-amber-500/10 border-amber-500/30">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
                        <div className="flex-1">
                          <h4 className="font-medium mb-2 text-amber-300">Required Fields for {requirements.label}</h4>
                          <ul className="space-y-1 text-sm text-gray-300">
                            {requirements.requiredFields.map((field) => (
                              <li key={field.name} className="flex items-center gap-2">
                                <span className="text-xs">⚠️</span>
                                <span>{field.label}</span>
                                {field.description && <span className="text-xs text-gray-500">- {field.description}</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Card Title</label>
                <input
                  type="text"
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  placeholder="My Card"
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Entity ID (optional)</label>
                <input
                  type="text"
                  value={newCardEntityId}
                  onChange={(e) => setNewCardEntityId(e.target.value)}
                  placeholder="light.living_room"
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

              {/* Dynamic Required Fields */}
              {(() => {
                const requirements = getCardRequirements(newCardType);
                if (requirements && requirements.requiredFields.length > 0) {
                  return requirements.requiredFields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {field.label} <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={newCardExtraFields[field.name] || ""}
                        onChange={(e) => setNewCardExtraFields({ ...newCardExtraFields, [field.name]: e.target.value })}
                        placeholder={field.placeholder || ""}
                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      />
                      {field.description && <p className="text-xs text-gray-500 mt-1">{field.description}</p>}
                    </div>
                  ));
                }
                return null;
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Position X <span className="text-xs text-gray-500">(0-{maxX - 1})</span>
                  </label>
                  <input
                    type="number"
                    value={newCardPosition.x}
                    onChange={(e) => setNewCardPosition({ ...newCardPosition, x: parseInt(e.target.value) || 0 })}
                    min="0"
                    max={maxX - 1}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Position Y <span className="text-xs text-gray-500">(0-{maxY - 1})</span>
                  </label>
                  <input
                    type="number"
                    value={newCardPosition.y}
                    onChange={(e) => setNewCardPosition({ ...newCardPosition, y: parseInt(e.target.value) || 0 })}
                    min="0"
                    max={maxY - 1}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Width <span className="text-xs text-gray-500">(1-{maxX})</span>
                  </label>
                  <input
                    type="number"
                    value={newCardSize.width}
                    onChange={(e) => setNewCardSize({ ...newCardSize, width: parseInt(e.target.value) || 1 })}
                    min="1"
                    max={maxX}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Height <span className="text-xs text-gray-500">(1-{maxY})</span>
                  </label>
                  <input
                    type="number"
                    value={newCardSize.height}
                    onChange={(e) => setNewCardSize({ ...newCardSize, height: parseInt(e.target.value) || 1 })}
                    min="1"
                    max={maxY}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => setShowAddCardModal(false)} className="px-4 py-2 text-gray-400 hover:text-gray-300 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleAddCard}
                disabled={!newCardTitle.trim()}
                className={`px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg ${
                  !newCardTitle.trim() ? "opacity-50 cursor-not-allowed" : "hover:shadow-xl hover:scale-105"
                }`}
              >
                <Save className="w-4 h-4" />
                Add Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Settings Modal */}
      {showDashboardSettingsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl w-[600px] max-w-[90vw] p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Settings className="w-6 h-6 text-blue-400" />
                Dashboard Settings
              </h2>
              <button
                onClick={() => setShowDashboardSettingsModal(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Dashboard Title</label>
                <input
                  type="text"
                  value={dashboardSettings.title}
                  onChange={(e) => setDashboardSettings({ ...dashboardSettings, title: e.target.value })}
                  placeholder="My Dashboard"
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Dashboard Icon</label>
                <input
                  type="text"
                  value={dashboardSettings.icon}
                  onChange={(e) => setDashboardSettings({ ...dashboardSettings, icon: e.target.value })}
                  placeholder="Home (Lucide icon name or image URL)"
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Use Lucide icon name (e.g., "Home", "Settings") or image URL</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Background Color</label>
                <input
                  type="text"
                  value={dashboardSettings.backgroundColor}
                  onChange={(e) => setDashboardSettings({ ...dashboardSettings, backgroundColor: e.target.value })}
                  placeholder="bg-gray-900 or #101112"
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Use Tailwind class (e.g., "bg-gray-900") or hex color (e.g., "#101112")</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Columns</label>
                  <input
                    type="number"
                    value={dashboardSettings.minColumns}
                    onChange={(e) => setDashboardSettings({ ...dashboardSettings, minColumns: parseInt(e.target.value) || 12 })}
                    min="1"
                    max="24"
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Grid width (1-24)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Rows</label>
                  <input
                    type="number"
                    value={dashboardSettings.minRows}
                    onChange={(e) => setDashboardSettings({ ...dashboardSettings, minRows: parseInt(e.target.value) || 10 })}
                    min="1"
                    max="50"
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Grid height (1-50)</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-400" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1 text-blue-300">Grid Settings</h4>
                    <p className="text-sm text-gray-300">
                      The minimum columns and rows define the grid size. Cards can be placed anywhere within this grid in edit mode.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => setShowDashboardSettingsModal(false)} className="px-4 py-2 text-gray-400 hover:text-gray-300 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSaveDashboardSettings}
                disabled={!dashboardSettings.title.trim()}
                className={`px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg ${
                  !dashboardSettings.title.trim() ? "opacity-50 cursor-not-allowed" : "hover:shadow-xl hover:scale-105"
                }`}
              >
                <Save className="w-4 h-4" />
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
