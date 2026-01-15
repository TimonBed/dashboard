import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "./Card";
import { useHomeAssistantStore } from "../../store/useHomeAssistantStore";
import { Thermometer, Battery, Sprout, Leaf } from "lucide-react";
import Badge from "../ui/Badge";
import { CardComponentProps } from "../../types/cardProps";
import { useSettingsStore } from "../../store/useSettingsStore";
import { HistoryService, HistoryState } from "../../services/historyService";
import { MiniSparkline } from "../ui/MiniSparkline";

interface PlantData {
  id: string; // or name
  name: string;
  batteryEntity?: string;
  moistureEntity?: string; // Soil moisture
  temperatureEntity?: string;
}

interface PlantSensorCardSpecificProps {
  title: string;
  plants?: PlantData[];
  // Legacy props for single plant backward compatibility
  batteryEntity?: string;
  moistureEntity?: string;
  temperatureEntity?: string;
}

type PlantSensorCardProps = CardComponentProps<PlantSensorCardSpecificProps>;

const PlantSensorCardComponent: React.FC<PlantSensorCardProps> = ({
  title,
  entityId,
  plants,
  batteryEntity,
  moistureEntity,
  temperatureEntity,
  onTitleChange,
  onJsonSave,
  onCardDelete,
  cardConfig,
}) => {
  const { entities } = useHomeAssistantStore();
  const homeAssistantToken = useSettingsStore((s) => s.homeAssistantToken);
  const getHomeAssistantURL = useSettingsStore((s) => s.getHomeAssistantURL);
  const baseUrl = getHomeAssistantURL();

  // Normalize plants data: if "plants" array exists use it, otherwise create array from legacy single plant props
  const plantsList: PlantData[] = plants || [
    {
      id: "default",
      name: title, // Use card title as name for single plant
      batteryEntity,
      moistureEntity,
      temperatureEntity,
    },
  ];

  const historyCacheRef = useRef<Map<string, number[]>>(new Map());
  const [historySeriesByEntityId, setHistorySeriesByEntityId] = useState<Record<string, number[]>>({});

  const historyEntityIds = useMemo(() => {
    const ids = plantsList.map((p) => p.moistureEntity).filter(Boolean) as string[];
    return Array.from(new Set(ids));
  }, [plantsList]);

  const downsample = (values: number[], maxPoints: number) => {
    if (values.length <= maxPoints) return values;
    const step = values.length / maxPoints;
    const sampled: number[] = [];
    for (let i = 0; i < maxPoints; i++) {
      sampled.push(values[Math.floor(i * step)]);
    }
    return sampled;
  };

  useEffect(() => {
    let cancelled = false;
    const missing = historyEntityIds.filter((id) => !historyCacheRef.current.has(id));
    if (!baseUrl || !homeAssistantToken || missing.length === 0) return;

    const load = async () => {
      const historyService = new HistoryService(baseUrl, homeAssistantToken);
      const updates: Record<string, number[]> = {};

      await Promise.all(
        missing.map(async (entityId) => {
          try {
            const states: HistoryState[] = await historyService.getStateChanges(entityId, 24);
            const numeric = states
              .map((s) => parseFloat(s.state))
              .filter((n) => !isNaN(n));

            const series = downsample(numeric, 48);
            historyCacheRef.current.set(entityId, series);
            updates[entityId] = series;
          } catch {
            historyCacheRef.current.set(entityId, []);
            updates[entityId] = [];
          }
        })
      );

      if (cancelled) return;
      if (Object.keys(updates).length > 0) {
        setHistorySeriesByEntityId((prev) => ({ ...prev, ...updates }));
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [baseUrl, homeAssistantToken, historyEntityIds]);

  const getSeries = (entityId?: string) => {
    if (!entityId) return [];
    return historyCacheRef.current.get(entityId) ?? historySeriesByEntityId[entityId] ?? [];
  };

  const getAverageTemperature = (): { display: string; unit: string } | null => {
    const temps: Array<{ value: number; unit: string }> = [];

    for (const plant of plantsList) {
      const tempEntityId = plant.temperatureEntity;
      if (!tempEntityId) continue;

      const entity = entities.get(tempEntityId);
      if (!entity || entity.state === "unavailable" || entity.state === "unknown") continue;

      const parsed = parseFloat(entity.state);
      if (isNaN(parsed)) continue;

      temps.push({ value: parsed, unit: entity.attributes.unit_of_measurement || "" });
    }

    if (temps.length === 0) return null;

    const avg = temps.reduce((sum, t) => sum + t.value, 0) / temps.length;
    const display = (Math.round(avg * 10) / 10).toFixed(1).replace(/\.0$/, "");
    const unit = temps.find((t) => t.unit)?.unit || "";

    return { display, unit };
  };

  const renderSensorRow = (entityId: string | undefined, icon: React.ReactNode, max: number, min: number = 0) => {
    let value = 0;
    let displayValue = "--";
    let unit = "";

    if (entityId) {
      const entity = entities.get(entityId);
      if (entity && entity.state !== "unavailable" && entity.state !== "unknown") {
        const parsed = parseFloat(entity.state);
        if (!isNaN(parsed)) {
          value = parsed;
          displayValue = Math.round(parsed).toString();
          unit = entity.attributes.unit_of_measurement || "";
        }
      }
    }

    const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
    const barColor = "bg-green-500";

    return (
      <div className="flex items-center gap-1.5 w-full h-4">
        <div className="text-gray-300 w-3 flex justify-center scale-90">{icon}</div>

        <div className="flex-1 bg-gray-700/30 rounded-full overflow-hidden" style={{ height: "5px" }}>
          <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
        </div>

        <div className="text-right min-w-[2.6rem] font-semibold text-white text-[10px] leading-none">
          {displayValue} <span className="text-[9px] text-gray-400">{unit}</span>
        </div>
      </div>
    );
  };

  const getBatteryColor = (level: number) => {
    if (level <= 20) return "red";
    if (level <= 50) return "yellow";
    return "green";
  };

  const renderBattery = (batteryEntity?: string) => {
    let level = 0;
    let hasData = false;

    if (batteryEntity) {
      const entity = entities.get(batteryEntity);
      if (entity) {
        const parsed = parseFloat(entity.state);
        if (!isNaN(parsed)) {
          level = parsed;
          hasData = true;
        }
      }
    }

    if (!hasData) return null;

    return (
      <Badge variant={getBatteryColor(level) as any} className="flex items-center gap-1 px-1.5 py-[2px] h-5 leading-none">
        <span className="text-[10px] font-semibold leading-none">{level}%</span>
        <Battery className="w-3 h-3" />
      </Badge>
    );
  };

  return (
    <Card
      title={plantsList.length > 1 ? title : plantsList[0].name}
      entityId={entityId}
      onTitleChange={onTitleChange}
      onJsonSave={onJsonSave}
      onCardDelete={onCardDelete}
      cardConfig={cardConfig}
      height="h-full"
      padding="px-3 py-2"
      hideHeader={true}
    >
      <div className="h-full flex flex-col min-h-0">
        {/* Compact header (matches Card look but uses much less vertical space than the default header) */}
        <div className="flex items-center gap-3 mb-1.5">
          <div className="p-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="w-5 h-5 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <h3 className="text-white font-semibold truncate">{title}</h3>
          {(() => {
            const avgTemp = getAverageTemperature();
            if (!avgTemp) return null;
            return (
              <div className="ml-auto flex items-center gap-1.5 text-white">
                <Thermometer className="w-4 h-4 text-gray-300" />
                <span className="text-[12px] font-semibold tabular-nums leading-none">{avgTemp.display}</span>
                <span className="text-[10px] text-gray-400 leading-none">{avgTemp.unit}</span>
              </div>
            );
          })()}
        </div>

        <div className="grid grid-cols-3 gap-2.5 flex-1 min-h-0 items-start">
          {plantsList.map((plant, index) => (
            <div key={index} className="relative flex flex-col gap-1 min-w-0 border-r border-white/5 last:border-r-0 pr-2">
              {/* Battery top right with a bit more inset from divider */}
              <div className="absolute top-0 right-1">{renderBattery(plant.batteryEntity)}</div>

              {/* Name */}
              {plantsList.length > 1 && (
                <span className="text-[11px] font-semibold text-white truncate pr-12" title={plant.name}>
                  {plant.name}
                </span>
              )}

              {/* Sensors */}
              <div className="flex flex-col gap-1 w-full mt-auto">
                {renderSensorRow(plant.moistureEntity, <Sprout className="w-3 h-3" />, 100, 0)}
              </div>

              {/* History graph (moisture) */}
              <div className="mt-1">
                <MiniSparkline values={getSeries(plant.moistureEntity)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export const PlantSensorCard = memo(PlantSensorCardComponent);
