import React, { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, Square } from "lucide-react";
import { Card } from "./Card";
import { useHomeAssistantStore } from "../../store/useHomeAssistantStore";
import { useHomeAssistant } from "../../hooks/useHomeAssistant";
import { ShutterClosed, ShutterHalfOpen, ShutterOpen } from "../icons/ShutterIcons";

interface ShutterCardProps {
  title: string;
  position?: number; // 0-100, current position
  state?: "up" | "down";
  onUp?: () => void;
  onDown?: () => void;
  onSetPosition?: (position: number) => void;
  onTitleChange?: (title: string, entityId?: string) => void;
  entityId?: string;
  disabled?: boolean;
  className?: string;
}

export const ShutterCard: React.FC<ShutterCardProps> = ({
  title,
  position = 0,
  state = "down",
  onUp,
  onDown,
  onSetPosition,
  onTitleChange,
  entityId,
  disabled = false,
  className = "",
}) => {
  const { entities } = useHomeAssistantStore();
  const { callService } = useHomeAssistant();
  const [isMoving, setIsMoving] = useState(false);
  const [lastPosition, setLastPosition] = useState(position);

  // Get real-time state from Home Assistant if entityId is provided
  const haEntity = entityId ? entities.get(entityId) : null;
  const realTimePosition = haEntity && haEntity.attributes.current_position !== undefined ? haEntity.attributes.current_position : position;
  const realTimeState = haEntity ? haEntity.state : state;

  // Detect movement by comparing current position with last known position
  useEffect(() => {
    if (realTimePosition !== lastPosition) {
      setIsMoving(true);
      setLastPosition(realTimePosition);
    }
  }, [realTimePosition, lastPosition]);

  // Auto-stop moving after 1 second of no position changes
  useEffect(() => {
    if (isMoving) {
      const timer = setTimeout(() => {
        setIsMoving(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isMoving, realTimePosition]);

  // Toggle shutter (open if closed, close if open)
  const handleToggle = async () => {
    if (!entityId || disabled) return;

    try {
      if (realTimePosition === 0) {
        // If closed, open it
        await callService("cover", "open_cover", { entity_id: entityId });
      } else if (realTimePosition === 100) {
        // If open, close it
        await callService("cover", "close_cover", { entity_id: entityId });
      } else {
        // If partially open, toggle based on current position
        if (realTimePosition < 50) {
          await callService("cover", "open_cover", { entity_id: entityId });
        } else {
          await callService("cover", "close_cover", { entity_id: entityId });
        }
      }
    } catch (error) {
      console.error("Failed to toggle shutter:", error);
    }
  };

  // Stop shutter movement
  const handleStop = async () => {
    if (!entityId || disabled) return;

    try {
      await callService("cover", "stop_cover", { entity_id: entityId });
      setIsMoving(false);
    } catch (error) {
      console.error("Failed to stop shutter:", error);
    }
  };

  // Create subtitle with current state
  const getSubtitle = () => {
    if (realTimeState === "open") return "Open";
    if (realTimeState === "closed") return "Closed";
    if (realTimePosition === 0) return "Closed";
    if (realTimePosition === 100) return "Open";
    return `${Math.round(realTimePosition)}%`;
  };

  // Get appropriate shutter icon based on position
  const getShutterIcon = () => {
    if (realTimePosition === 0) {
      return <ShutterClosed className="w-5 h-5 text-slate-400" />;
    } else if (realTimePosition === 100) {
      return <ShutterOpen className="w-5 h-5 text-orange-400" />;
    } else {
      return <ShutterHalfOpen className="w-5 h-5 text-orange-300" />;
    }
  };
  return (
    <Card
      title={title}
      subtitle={isMoving ? `Moving... ${realTimePosition}% Open` : `${realTimePosition}% Open`}
      icon={getShutterIcon()}
      onTitleChange={onTitleChange}
      entityId={entityId}
      disabled={disabled}
      className={`bg-gradient-to-br from-gray-900/90 to-gray-800/90 ${className}`}
      width="w-80"
      height="h-16"
      onClick={handleToggle}
    >
      {/* Stop Button - Full Height Right */}
      {isMoving && (
        <div className="absolute top-0 right-0 h-full z-10 flex items-center pr-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStop();
            }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 text-white flex items-center justify-center rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 shadow-xl border border-gray-700/70"
            style={{ height: "2.5rem", width: "2.5rem", padding: 0 }} // 2.5rem = 40px, matches w-10 h-10 (icon size)
            title="Stop shutter movement"
          >
            <Square className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Enhanced Shutter Visualization */}
      {/* <div className="mb-6">
        <div className="relative w-full h-16 bg-gradient-to-b from-slate-800 via-slate-700 to-slate-900 rounded-xl overflow-hidden border-2 border-slate-600/60 shadow-2xl">
          <div className="absolute inset-1 border-2 border-slate-500/40 rounded-lg bg-gradient-to-b from-slate-600/30 to-slate-800/50">
            <div className="relative h-full overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-full h-2.5 bg-gradient-to-r from-slate-400 via-slate-500 to-slate-400 border-b border-slate-600/60 transition-all duration-700 ease-out shadow-lg"
                  style={{
                    top: `${i * 9}px`,
                    transform: `translateY(${(100 - realTimePosition) * 0.3}px)`,
                    opacity: realTimePosition > 0 ? 0.9 + (realTimePosition / 100) * 0.1 : 0.3,
                    boxShadow: realTimePosition > 0 ? `0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)` : `0 1px 4px rgba(0,0,0,0.2)`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      */}

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: ${realTimePosition > 0 ? "linear-gradient(135deg, #f97316, #ea580c, #dc2626)" : "linear-gradient(135deg, #64748b, #475569, #334155)"};
            cursor: pointer;
            border: 3px solid ${realTimePosition > 0 ? "#f97316" : "#475569"};
            box-shadow: 0 6px 20px ${realTimePosition > 0 ? "rgba(249, 115, 22, 0.5)" : "rgba(100, 116, 139, 0.5)"}, 0 0 0 1px rgba(255,255,255,0.1);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .slider::-webkit-slider-thumb:hover {
            transform: scale(1.15);
            box-shadow: 0 8px 25px ${realTimePosition > 0 ? "rgba(249, 115, 22, 0.7)" : "rgba(100, 116, 139, 0.7)"}, 0 0 0 2px rgba(255,255,255,0.2);
          }
          
          .slider::-webkit-slider-thumb:active {
            transform: scale(1.05);
          }
          
          .slider::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: ${realTimePosition > 0 ? "linear-gradient(135deg, #f97316, #ea580c, #dc2626)" : "linear-gradient(135deg, #64748b, #475569, #334155)"};
            cursor: pointer;
            border: 3px solid ${realTimePosition > 0 ? "#f97316" : "#475569"};
            box-shadow: 0 6px 20px ${realTimePosition > 0 ? "rgba(249, 115, 22, 0.5)" : "rgba(100, 116, 139, 0.5)"}, 0 0 0 1px rgba(255,255,255,0.1);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .slider::-moz-range-thumb:hover {
            transform: scale(1.15);
            box-shadow: 0 8px 25px ${realTimePosition > 0 ? "rgba(249, 115, 22, 0.7)" : "rgba(100, 116, 139, 0.7)"}, 0 0 0 2px rgba(255,255,255,0.2);
          }
          
          .slider::-moz-range-thumb:active {
            transform: scale(1.05);
          }
        `,
        }}
      />
    </Card>
  );
};
