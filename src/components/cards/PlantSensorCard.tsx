import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "./Card";
import { useHomeAssistantStore } from "../../store/useHomeAssistantStore";
import { Thermometer, Sprout, Leaf } from "lucide-react";
import { CardComponentProps } from "../../types/cardProps";
import { useSettingsStore } from "../../store/useSettingsStore";
import { HistoryService, HistoryState } from "../../services/historyService";
import { MiniSparkline } from "../ui/MiniSparkline";
import { BatteryBadge } from "../ui/BatteryBadge";
import { ProgressBarRow } from "../ui/ProgressBarRow";

interface PlantData {
  id?: string; // or name
  name?: string;
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

  const HISTORY_HOURS = 24;
  const HISTORY_POINTS = 48;

  // Normalize plants data: if "plants" array exists use it, otherwise create array from legacy single plant props
  const plantsList = useMemo((): Array<Required<Pick<PlantData, "id" | "name">> & Omit<PlantData, "id" | "name">> => {
    const source: PlantData[] =
      plants && plants.length > 0
        ? plants
        : [
            {
              id: "default",
              name: title, // Use card title as name for single plant
              batteryEntity,
              moistureEntity,
              temperatureEntity,
            },
          ];

    return source.map((p, i) => ({
      ...p,
      id: p.id && p.id.trim() ? p.id : `plant-${i + 1}`,
      name: p.name && p.name.trim() ? p.name : `Plant ${i + 1}`,
    }));
  }, [plants, title, batteryEntity, moistureEntity, temperatureEntity]);

  const historyCacheRef = useRef<Map<string, number[]>>(new Map());
  const [historySeriesByEntityId, setHistorySeriesByEntityId] = useState<Record<string, number[]>>({});

  const historyEntityIds = useMemo(() => {
    const ids = plantsList.map((p) => p.moistureEntity).filter(Boolean) as string[];
    return Array.from(new Set(ids));
  }, [plantsList]);

  const downsample = (values: number[], maxPoints: number) => {
    if (maxPoints <= 0) return [];
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
            const states: HistoryState[] = await historyService.getStateChanges(entityId, HISTORY_HOURS);
            const numeric = states.map((s) => parseFloat(s.state)).filter((n) => !isNaN(n));

            const series = downsample(numeric, HISTORY_POINTS);
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

  const averageTemperature = useMemo((): { display: string; unit: string } | null => {
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
  }, [plantsList, entities]);

  const getEntityNumeric = (id?: string): { value: number; displayValue: string; unit: string; hasData: boolean } => {
    if (!id) return { value: 0, displayValue: "--", unit: "", hasData: false };
    const entity = entities.get(id);
    if (!entity || entity.state === "unavailable" || entity.state === "unknown") return { value: 0, displayValue: "--", unit: "", hasData: false };
    const parsed = parseFloat(entity.state);
    if (isNaN(parsed)) return { value: 0, displayValue: "--", unit: "", hasData: false };
    return {
      value: parsed,
      displayValue: Math.round(parsed).toString(),
      unit: entity.attributes.unit_of_measurement || "",
      hasData: true,
    };
  };

  const getBatteryLevel = (batteryEntity?: string) => {
    const { value, hasData } = getEntityNumeric(batteryEntity);
    return hasData ? value : null;
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
      padding="px-2.5 py-1.5"
      hideHeader={true}
    >
      <div className="h-full flex flex-col min-h-0">
        {/* Compact header (matches Card look but uses much less vertical space than the default header) */}
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="w-4 h-4 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-green-500" />
            </div>
          </div>
          <h3 className="text-white font-semibold truncate text-sm">{title}</h3>
          {averageTemperature ? (
            <div className="ml-auto flex items-center gap-1 text-white">
              <Thermometer className="w-3.5 h-3.5 text-gray-300" />
              <span className="text-[11px] font-semibold tabular-nums leading-none">{averageTemperature.display}</span>
              <span className="text-[10px] text-gray-400 leading-none">{averageTemperature.unit}</span>
            </div>
          ) : null}
        </div>

        {plantsList.length > 4 ? (
          <div className="flex flex-1 min-h-0 overflow-x-auto items-stretch -mx-2.5 px-2.5">
            {plantsList.map((plant, idx) => (
              <div
                key={`${plant.id}-${idx}`}
                className="relative flex flex-col gap-0.5 min-w-[150px] w-[150px] px-2 py-0.5 border-r border-white/5 last:border-r-0"
              >
                <div className="absolute top-0 right-1">
                  <BatteryBadge level={getBatteryLevel(plant.batteryEntity)} />
                </div>

                <span className="text-[10px] font-semibold text-white truncate pr-12" title={plant.name}>
                  {plant.name}
                </span>

                {plant.moistureEntity ? (
                  <div className="flex flex-col gap-0.5 w-full mt-auto">
                    {(() => {
                      const s = getEntityNumeric(plant.moistureEntity);
                      return (
                        <ProgressBarRow
                          icon={<Sprout className="w-3 h-3" />}
                          value={s.value}
                          displayValue={s.displayValue}
                          unit={s.unit}
                          max={100}
                          min={0}
                          className="h-3.5"
                        />
                      );
                    })()}
                  </div>
                ) : null}

                {plant.moistureEntity ? (
                  <div className="mt-0.5">
                    <MiniSparkline values={getSeries(plant.moistureEntity)} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-2 flex-1 min-h-0 items-start" style={{ gridTemplateColumns: `repeat(${Math.max(1, plantsList.length)}, minmax(0, 1fr))` }}>
            {plantsList.map((plant, idx) => (
              <div key={`${plant.id}-${idx}`} className="relative flex flex-col gap-0.5 min-w-0 border-r border-white/5 last:border-r-0 pr-1.5">
                {/* Battery top right with a bit more inset from divider */}
                <div className="absolute top-0 right-1">
                  <BatteryBadge level={getBatteryLevel(plant.batteryEntity)} />
                </div>

                {/* Name */}
                {plantsList.length > 1 && (
                  <span className="text-[10px] font-semibold text-white truncate pr-12" title={plant.name}>
                    {plant.name}
                  </span>
                )}

                {/* Sensors */}
                {plant.moistureEntity ? (
                  <div className="flex flex-col gap-0.5 w-full mt-auto">
                    {(() => {
                      const s = getEntityNumeric(plant.moistureEntity);
                      return (
                        <ProgressBarRow
                          icon={<Sprout className="w-3 h-3" />}
                          value={s.value}
                          displayValue={s.displayValue}
                          unit={s.unit}
                          max={100}
                          min={0}
                          className="h-3.5"
                        />
                      );
                    })()}
                  </div>
                ) : null}

                {/* History graph (moisture) */}
                {plant.moistureEntity ? (
                  <div className="mt-0.5">
                    <MiniSparkline values={getSeries(plant.moistureEntity)} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export const PlantSensorCard = memo(PlantSensorCardComponent);
