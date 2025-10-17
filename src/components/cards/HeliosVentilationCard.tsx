import React, { useState } from "react";
import { Fan, Home, User, Zap, RotateCcw, Thermometer } from "lucide-react";
import { Card } from "./Card";
import { useHomeAssistantStore } from "../../store/useHomeAssistantStore";
import { useHomeAssistant } from "../../hooks/useHomeAssistant";
import Badge from "../ui/Badge";
import { CardComponentProps } from "../../types/cardProps";

interface HeliosVentilationCardSpecificProps {
  title: string;
  width?: string;
  height?: string;
  heliosSettings?: {
    indoorAirEntity?: string;
    supplyAirEntity?: string;
    outdoorAirEntity?: string;
    exhaustAirEntity?: string;
    fanSpeedEntity?: string;
    buttonStateEntity?: string;
  };
}

export type HeliosVentilationCardProps = CardComponentProps<HeliosVentilationCardSpecificProps>;

export const HeliosVentilationCard: React.FC<HeliosVentilationCardProps> = ({
  title,
  entityId,
  onTitleChange,
  onJsonSave,
  onCardDelete,
  cardConfig,
  className = "",
  width = "w-full",
  height = "h-640",
  heliosSettings = {},
}) => {
  const { entities } = useHomeAssistantStore();
  const { callService } = useHomeAssistant();
  const haEntity = entityId ? entities.get(entityId) : undefined;
  const [selectedMode, setSelectedMode] = useState("");

  // Get ventilation data from Home Assistant using configured entities
  const getSupplyTemp = () => {
    if (heliosSettings.supplyAirEntity) {
      const entity = entities.get(heliosSettings.supplyAirEntity);
      return parseFloat(entity?.state || "NA");
    }
    return haEntity?.attributes?.supply_temperature || 18.0;
  };

  const getIndoorTemp = () => {
    if (heliosSettings.indoorAirEntity) {
      const entity = entities.get(heliosSettings.indoorAirEntity);
      return parseFloat(entity?.state || "NA");
    }
    return haEntity?.attributes?.indoor_temperature || 24.0;
  };

  const getOutdoorTemp = () => {
    if (heliosSettings.outdoorAirEntity) {
      const entity = entities.get(heliosSettings.outdoorAirEntity);
      return parseFloat(entity?.state || "NA");
    }
    return haEntity?.attributes?.outdoor_temperature || 16.0;
  };

  const getExhaustTemp = () => {
    if (heliosSettings.exhaustAirEntity) {
      const entity = entities.get(heliosSettings.exhaustAirEntity);
      return parseFloat(entity?.state || "NA");
    }
    return haEntity?.attributes?.exhaust_temperature || 20.0;
  };

  const getFanSpeed = () => {
    if (heliosSettings.fanSpeedEntity) {
      const entity = entities.get(heliosSettings.fanSpeedEntity);
      return parseFloat(entity?.state || "NA");
    }
    return haEntity?.attributes?.fan_speed || 40;
  };

  const getCurrentMode = () => {
    // If user has selected a mode locally, use that for immediate feedback
    if (selectedMode) {
      return selectedMode;
    }

    // Otherwise use Home Assistant entity state
    if (heliosSettings.buttonStateEntity) {
      const entity = entities.get(heliosSettings.buttonStateEntity);
      return entity?.state || "AtHome";
    }
    return haEntity?.attributes?.mode || "AtHome";
  };

  const getCurrentModeOptions = () => {
    if (heliosSettings.buttonStateEntity) {
      const entity = entities.get(heliosSettings.buttonStateEntity);
      return entity?.attributes?.options || ["home", "away", "boost", "auto"];
    }
    return ["home", "away", "boost", "auto"];
  };

  const supplyTemp = getSupplyTemp();
  const indoorTemp = getIndoorTemp();
  const outdoorTemp = getOutdoorTemp();
  const exhaustTemp = getExhaustTemp();
  const fanSpeed = getFanSpeed();
  const currentMode = getCurrentMode();
  const modeOptions = getCurrentModeOptions();

  // Mode buttons configuration
  const modes = [
    { id: "AtHome", label: "Home", icon: Home, active: currentMode === "AtHome" },
    { id: "Away", label: "Away", icon: User, active: currentMode === "Away" },
    { id: "Intensive", label: "Boost", icon: Zap, active: currentMode === "Intensive" },
    { id: "Individual", label: "Auto", icon: RotateCcw, active: currentMode === "Individual" },
  ];

  // Get current mode display name
  const getCurrentModeDisplay = () => {
    const modeMap: { [key: string]: string } = {
      AtHome: "Home",
      Away: "Away",
      Intensive: "Boost",
      Individual: "Auto",
    };
    return modeMap[currentMode] || currentMode;
  };

  // Get current mode color
  const getCurrentModeColor = () => {
    const colorMap: { [key: string]: string } = {
      AtHome: "blue",
      Away: "gray",
      Intensive: "orange",
      Individual: "green",
    };
    return colorMap[currentMode] || "blue";
  };

  // Get current mode icon color classes
  const getCurrentModeIconColor = () => {
    const colorMap: { [key: string]: string } = {
      AtHome: "text-blue-400",
      Away: "text-gray-400",
      Intensive: "text-orange-400",
      Individual: "text-green-400",
    };
    return colorMap[currentMode] || "text-blue-400";
  };

  // Get button background color for active state
  const getButtonBgColor = (modeId: string) => {
    const colorMap: { [key: string]: string } = {
      AtHome: "bg-blue-500",
      Away: "bg-gray-500",
      Intensive: "bg-orange-500",
      Individual: "bg-green-500",
    };
    return colorMap[modeId] || "bg-blue-500";
  };

  const handleModeChange = async (modeId: string) => {
    try {
      // Update local state for immediate UI feedback
      setSelectedMode(modeId);

      // Call Home Assistant service to change the mode
      if (heliosSettings.buttonStateEntity) {
        await callService("select", "select_option", {
          entity_id: heliosSettings.buttonStateEntity,
          option: modeId,
        });
        console.log(`Changed mode to: ${modeId}`);
      } else {
        console.warn("No button state entity configured for mode changes");
      }
    } catch (error) {
      console.error("Failed to change mode:", error);
      // Reset local state on error
      setSelectedMode("");
    }
  };

  return (
    <Card
      title={title}
      subtitle=""
      onTitleChange={onTitleChange}
      onJsonSave={onJsonSave}
      onCardDelete={onCardDelete}
      cardConfig={cardConfig}
      entityId={entityId}
      icon={
        <Fan
          className={`w-5 h-5 ${getCurrentModeIconColor()} ${fanSpeed > 0 ? "animate-spin" : ""}`}
          style={{
            animationDuration: fanSpeed > 0 ? `${Math.max(0.5, 4 - (fanSpeed / 100) * 3.5)}s` : "4s",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
          }}
        />
      }
      className={`bg-gradient-to-br from-gray-900/90 to-gray-800/90 ${className}`}
      width={width}
      height={height}
    >
      {/* Header with mode indicator */}
      <div className="absolute top-3 right-3">
        <Badge variant={getCurrentModeColor() as any} className="flex items-center gap-2">
          <Home className={`w-4 h-4 ${getCurrentModeIconColor()}`} />
          <span className="text-sm font-medium">{getCurrentModeDisplay()}</span>
        </Badge>
      </div>

      {/* Main content area with heat exchanger diagram */}
      <div className="flex-1 flex items-center py-4">
        <div className="w-full grid grid-cols-3 gap-4 items-center">
          {/* Left Column */}
          <div className="flex flex-col gap-4">
            {/* Indoor Air - Top */}
            <div className="flex flex-col items-center">
              <div className="text-red-400 text-sm font-semibold mb-1">Indoor air</div>
              <div className="flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-red-400" />
                <span className="text-white text-base font-bold">{indoorTemp}°C</span>
              </div>
            </div>

            {/* Supply Air - Bottom */}
            <div className="flex flex-col items-center">
              <div className="text-blue-400 text-sm font-semibold mb-1">Supply air</div>
              <div className="flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-white text-base font-bold">{supplyTemp}°C</span>
              </div>
            </div>
          </div>

          {/* Center Column - Fan Speed */}
          <div className="flex items-center justify-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="absolute top-0 left-0 w-24 h-24" viewBox="0 0 96 96">
                {/* Background circle */}
                <circle cx="48" cy="48" r="44" fill="none" stroke="#122E63" strokeOpacity="0.25" strokeWidth="4.5" />
                {/* Progress circle */}
                <circle
                  cx="48"
                  cy="48"
                  r="44"
                  fill="none"
                  stroke="#2D9CFA"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${2 * Math.PI * 44 * (1 - fanSpeed / 100)}`}
                  transform="rotate(-90 48 48)"
                  className="transition-all duration-500 ease-in-out"
                />
              </svg>
              {/* Fan icon with spin animation */}
              <div className="relative z-10 flex flex-col items-center justify-center">
                <Fan
                  className={`w-7 h-7 text-blue-400 mb-1 ${fanSpeed > 0 ? "animate-spin" : ""}`}
                  style={{
                    animationDuration: fanSpeed > 0 ? `${Math.max(0.5, 4 - (fanSpeed / 100) * 3.5)}s` : "4s",
                    animationTimingFunction: "linear",
                    animationIterationCount: "infinite",
                  }}
                />
                <span className="text-lg font-semibold text-gray-200 mt-1">{fanSpeed}%</span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-4">
            {/* Outdoor Air - Top */}
            <div className="flex flex-col items-center">
              <div className="text-green-400 text-sm font-semibold mb-1">Outdoor air</div>
              <div className="flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-green-400" />
                <span className="text-white text-base font-bold">{outdoorTemp}°C</span>
              </div>
            </div>

            {/* Exhaust Air - Bottom */}
            <div className="flex flex-col items-center">
              <div className="text-orange-400 text-sm font-semibold mb-1">Exhaust air</div>
              <div className="flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-white text-base font-bold">{exhaustTemp}°C</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mode buttons */}
      <div>
        <div className="flex gap-2">
          {modes.map((mode) => {
            const IconComponent = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2  rounded-lg transition-all duration-200 ${
                  mode.active ? `${getButtonBgColor(mode.id)} text-white` : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                }`}
              >
                <IconComponent className="w-4 h-4 mb-1" />
                <span className="text-xs font-medium">{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
