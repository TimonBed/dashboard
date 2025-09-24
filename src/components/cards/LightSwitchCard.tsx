import React, { useState, useRef, useCallback } from "react";
import { Lightbulb, LightbulbOff, Sun, Moon } from "lucide-react";
import { Card } from "./Card";
import { useHomeAssistantStore } from "../../store/useHomeAssistantStore";
import { useHomeAssistant } from "../../hooks/useHomeAssistant";

interface LightSwitchCardProps {
  title: string;
  isOn?: boolean;
  brightness?: number; // 0-100
  color?: string; // hex color
  onClick?: () => void;
  onTitleChange?: (title: string, entityId?: string) => void;
  entityId?: string;
  disabled?: boolean;
  className?: string;
}

export const LightSwitchCard: React.FC<LightSwitchCardProps> = ({
  title,
  isOn = false,
  brightness = 255,
  color = "#fbbf24", // amber default
  onClick,
  onTitleChange,
  entityId,
  disabled = false,
  className = "",
}) => {
  const { entities } = useHomeAssistantStore();
  const { callService } = useHomeAssistant();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [initialBrightness, setInitialBrightness] = useState(0);
  const [currentDragBrightness, setCurrentDragBrightness] = useState(brightness);
  const [disableSync, setDisableSync] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Get real-time state from Home Assistant if entityId is provided
  const haEntity = entityId ? entities.get(entityId) : null;

  // Check if brightness control should be available
  const hasBrightnessControl = haEntity && haEntity.attributes.brightness !== undefined;
  const realTimeIsOn = haEntity ? haEntity.state === "on" : isOn;
  const realTimeBrightness = haEntity && haEntity.attributes.brightness !== undefined ? Math.round((haEntity.attributes.brightness / 255) * 100) : brightness;
  const realTimeColor =
    haEntity && haEntity.attributes.rgb_color ? `#${haEntity.attributes.rgb_color.map((c: number) => c.toString(16).padStart(2, "0")).join("")}` : color;

  // Debug WebSocket state changes
  React.useEffect(() => {
    if (entityId && haEntity) {
      console.log(`LightSwitchCard ${entityId} state changed:`, {
        state: haEntity.state,
        brightness: haEntity.attributes.brightness,
        brightnessPercent: realTimeBrightness,
        isOn: realTimeIsOn,
      });
    }
  }, [entityId, haEntity, realTimeBrightness, realTimeIsOn]);

  // Update currentDragBrightness when realTimeBrightness changes (only when not dragging and sync not disabled)
  React.useEffect(() => {
    if (!isDragging && !disableSync) {
      setCurrentDragBrightness(realTimeBrightness);
    }
  }, [realTimeBrightness, isDragging, disableSync]);

  // Handle brightness change
  const handleBrightnessChange = useCallback(
    async (newBrightness: number) => {
      if (!entityId || !callService) return;

      const clampedBrightness = Math.max(1, Math.min(255, Math.round(newBrightness * 2.55))); // Convert 0-100 to 1-255

      try {
        console.log(`Setting brightness for ${entityId} to ${clampedBrightness} (${newBrightness}%)`);
        await callService("light", "turn_on", {
          entity_id: entityId,
          brightness: clampedBrightness,
        });
        console.log(`Successfully set brightness for ${entityId} to ${clampedBrightness}`);
      } catch (error) {
        console.error(`Failed to set brightness for ${entityId}:`, error);
      }
    },
    [entityId, callService]
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || !hasBrightnessControl) return; // Disable dragging when no brightness control

      e.preventDefault();
      setIsDragging(true);

      // Get the card's bounding rectangle
      const cardRect = cardRef.current?.getBoundingClientRect();
      if (!cardRect) return;

      // Calculate the initial position relative to the card
      const relativeX = e.clientX - cardRect.left;
      const initialBrightnessFromPosition = Math.max(0, Math.min(100, (relativeX / cardRect.width) * 100));

      setDragStartX(e.clientX);
      setInitialBrightness(realTimeBrightness);
      // Start with current real-time brightness, not mouse position
      setCurrentDragBrightness(realTimeBrightness);
    },
    [disabled, hasBrightnessControl, realTimeBrightness]
  );

  // Handle drag move
  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !cardRef.current) return;

      // Get the card's bounding rectangle
      const cardRect = cardRef.current.getBoundingClientRect();

      // Calculate the position relative to the card
      const relativeX = e.clientX - cardRect.left;
      const newBrightness = Math.max(0, Math.min(100, (relativeX / cardRect.width) * 100));

      // Store the calculated brightness but don't apply it yet
      setCurrentDragBrightness(newBrightness);
    },
    [isDragging]
  );

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      if (currentDragBrightness !== initialBrightness) {
        // Apply the brightness change when drag ends
        console.log(`Drag ended - applying brightness change from ${initialBrightness}% to ${currentDragBrightness}%`);
        handleBrightnessChange(currentDragBrightness);
      } else {
        console.log(`Drag ended - no brightness change needed (${currentDragBrightness}%)`);
      }
      setIsDragging(false);

      // Disable sync for 0.5 seconds to prevent snapping
      setDisableSync(true);
      setTimeout(() => {
        setDisableSync(false);
      }, 500);
    }
  }, [isDragging, currentDragBrightness, initialBrightness, handleBrightnessChange]);

  // Add event listeners for drag
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleDragMove);
      document.addEventListener("mouseup", handleDragEnd);

      return () => {
        document.removeEventListener("mousemove", handleDragMove);
        document.removeEventListener("mouseup", handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Handle light toggle with animation
  const handleToggle = async () => {
    if (disabled || isDragging) return;

    // Trigger animation
    setIsAnimating(true);

    // Reset animation after duration
    setTimeout(() => setIsAnimating(false), 600);

    if (entityId && callService) {
      try {
        const service = realTimeIsOn ? "turn_off" : "turn_on";
        await callService("light", service, { entity_id: entityId });
        console.log(`Toggled light ${entityId} to ${service}`);
      } catch (error) {
        console.error(`Failed to toggle light ${entityId}:`, error);
      }
    } else if (onClick) {
      // Fallback to local onClick if no entityId or callService
      onClick();
    }
  };

  // Handle click to prevent toggle when dragging
  const handleClick = () => {
    if (isDragging) {
      return;
    }
    handleToggle();
  };
  const getLightIcon = () => {
    if (realTimeIsOn) {
      const IconComponent = realTimeBrightness > 50 ? Sun : Moon;
      const brightnessMultiplier = haEntity && haEntity.attributes.brightness !== undefined ? haEntity.attributes.brightness / 255 : 1;

      return (
        <IconComponent
          className="w-4 h-4 transition-all duration-500"
          style={{
            color: realTimeColor,
            filter: `
              drop-shadow(0 0 6px ${realTimeColor}60) 
              drop-shadow(0 0 12px ${realTimeColor}40)
              drop-shadow(0 0 18px ${realTimeColor}20)
            `,
            opacity: Math.max(0.8, brightnessMultiplier),
            transform: `scale(${0.9 + brightnessMultiplier * 0.2})`,
          }}
        />
      );
    }
    return (
      <LightbulbOff
        className="w-4 h-4 text-gray-500 transition-all duration-300"
        style={{
          opacity: 0.6,
        }}
      />
    );
  };

  // Create subtitle with brightness or off status
  const getSubtitle = () => {
    if (!realTimeIsOn) return "Off";

    // Only show brightness if brightness control is available
    if (hasBrightnessControl && haEntity && haEntity.attributes.brightness !== undefined) {
      const brightnessPercent = Math.round((haEntity.attributes.brightness / 255) * 100);
      return `${brightnessPercent}%`;
    }

    return "On";
  };

  return (
    <Card
      title={title}
      subtitle={getSubtitle()}
      icon={getLightIcon()}
      onClick={disabled ? undefined : handleClick}
      onTitleChange={onTitleChange}
      entityId={entityId}
      disabled={disabled}
      className={`${className} relative overflow-hidden transition-all duration-300 ${isAnimating ? "scale-95 shadow-2xl" : "scale-100"} ${
        isDragging ? "cursor-grabbing" : hasBrightnessControl ? (realTimeIsOn ? "cursor-grab" : "cursor-pointer") : "cursor-pointer"
      }`}
      width="w-full"
      height="h-16"
      ref={cardRef}
      onMouseDown={handleDragStart}
    >
      {/* Click animation overlay */}
      {isAnimating && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${realTimeColor}80 0%, transparent 70%)`,
            animation: "pulse 0.6s ease-out",
          }}
        />
      )}

      {/* Drag position indicator - only show when brightness control is available */}
      {hasBrightnessControl && (realTimeIsOn || isDragging) && (
        <div
          className="absolute top-1/2 left-0 pointer-events-none transform -translate-y-1/2"
          style={{
            left: `calc(${Math.max(0, Math.min(100, currentDragBrightness))}% - 8px)`,
            width: "16px",
            height: "120%",
            background: `radial-gradient(circle, ${realTimeColor}80 0%, ${realTimeColor}40 50%, transparent 100%)`,
            borderRadius: "20%",
            border: `2px solid ${realTimeColor}60`,
            boxShadow: `0 0 8px ${realTimeColor}40, 0 0 16px ${realTimeColor}20`,
            opacity: isDragging ? 0.7 : 0.3,
          }}
        />
      )}

      {/* Horizontal brightness indicator - always show */}
      {(realTimeIsOn || isDragging) && (
        <div
          className="absolute top-0 left-0 h-full pointer-events-none"
          style={{
            // Use current drag brightness if dragging, otherwise use real-time brightness
            width: isDragging
              ? `calc(${Math.max(0.03, currentDragBrightness / 100)} * 100%)`
              : haEntity && haEntity.attributes.brightness !== undefined
              ? `calc(${Math.max(0.03, haEntity.attributes.brightness / 255)} * 100%)`
              : "100%",
            minWidth: "8px",
            maxWidth: "100%",
            height: "100%",
            background: `linear-gradient(to right, ${realTimeColor}50 0%, ${realTimeColor}30 40%, ${realTimeColor}15 70%, transparent 100%)`,
            opacity: isDragging
              ? Math.max(0.18, currentDragBrightness / 120)
              : haEntity && haEntity.attributes.brightness !== undefined
              ? Math.max(0.18, haEntity.attributes.brightness / 170)
              : 0.7,
            transition: isDragging ? "none" : "width 0.4s, opacity 0.4s",
          }}
        />
      )}

      {/* Light visualization */}
      {/* <div className="flex-1 flex items-center justify-center mb-3">
        <div
          className={`w-16 h-16 rounded-full transition-all duration-500 ${realTimeIsOn ? "shadow-2xl" : "shadow-inner"}`}
          style={{
            background: realTimeIsOn
              ? `radial-gradient(circle, ${realTimeColor} 0%, ${realTimeColor}80 30%, ${realTimeColor}40 60%, transparent 100%)`
              : "radial-gradient(circle, #374151 0%, #1f2937 100%)",
            boxShadow: realTimeIsOn
              ? `0 0 ${
                  haEntity && haEntity.attributes.brightness !== undefined ? 20 + (haEntity.attributes.brightness / 255) * 30 : 20
                }px ${realTimeColor}40, 0 0 ${
                  haEntity && haEntity.attributes.brightness !== undefined ? 40 + (haEntity.attributes.brightness / 255) * 60 : 40
                }px ${realTimeColor}20, inset 0 0 20px rgba(255,255,255,0.1)`
              : "inset 0 0 20px rgba(0,0,0,0.3)",
            opacity: realTimeIsOn && haEntity && haEntity.attributes.brightness !== undefined ? Math.max(0.3, haEntity.attributes.brightness / 255) : 1,
          }}
        >
          <div className="w-full h-full flex items-center justify-center">
            {realTimeIsOn ? (
              <Lightbulb
                className="w-8 h-8 text-white drop-shadow-lg"
                style={{
                  opacity: haEntity && haEntity.attributes.brightness !== undefined ? Math.max(0.5, haEntity.attributes.brightness / 255) : 1,
                }}
              />
            ) : (
              <LightbulbOff className="w-8 h-8 text-gray-500" />
            )}
          </div> */}

      {/* CSS Animation Keyframes */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes pulse {
            0% {
              opacity: 0;
              transform: scale(0.8);
            }
            50% {
              opacity: 1;
              transform: scale(1.1);
            }
            100% {
              opacity: 0;
              transform: scale(1.2);
            }
          }
        `,
        }}
      />
    </Card>
  );
};
