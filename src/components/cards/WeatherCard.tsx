import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Cloud, CloudRain, Sun, CloudSnow, CloudDrizzle, Wind } from "lucide-react";
import { Card } from "./Card";
import { useHomeAssistantStore } from "../../store/useHomeAssistantStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { CardComponentProps } from "../../types/cardProps";

interface WeatherForecast {
  time: string;
  temperature: number;
  condition: string;
  icon: string;
}

interface WeatherCardSpecificProps {
  zipCode?: string;
}

type WeatherCardProps = CardComponentProps<WeatherCardSpecificProps>;

export const WeatherCard: React.FC<WeatherCardProps> = ({
  title = "Weather",
  entityId,
  zipCode = "21033",
  onTitleChange,
  onJsonSave,
  onCardDelete,
  cardConfig,
  disabled = false,
  className = "",
}) => {
  const { openWeatherApiKey } = useSettingsStore();
  const [forecasts, setForecasts] = useState<WeatherForecast[]>([]);
  const [currentCondition, setCurrentCondition] = useState<string>("Cloudy");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clickedSegment, setClickedSegment] = useState<{ condition: string; timeout: NodeJS.Timeout | null } | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const fetchWeatherData = useCallback(async () => {
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds

    // Only fetch if it's been more than 10 minutes since last fetch
    if (now - lastFetchTime < tenMinutes && forecasts.length > 0) {
      return;
    }

    setError(null);
    setLoading(true);
    setLastFetchTime(now);

    try {
      // First, try to get data from Home Assistant weather entity
      if (entityId) {
        const haEntity = useHomeAssistantStore.getState().entities.get(entityId);
        if (haEntity && haEntity.attributes.forecast) {
          // Get 6 forecasts over 18 hours (every 3 hours)
          const forecasts: WeatherForecast[] = [];
          const now = Date.now();

          for (let i = 0; i < 6; i++) {
            const targetTime = now + i * 3 * 60 * 60 * 1000; // Every 3 hours

            // Find the closest forecast point
            const closest = haEntity.attributes.forecast.reduce((prev: any, curr: any) => {
              const prevDiff = Math.abs(new Date(prev.datetime).getTime() - targetTime);
              const currDiff = Math.abs(new Date(curr.datetime).getTime() - targetTime);
              return currDiff < prevDiff ? curr : prev;
            });

            forecasts.push({
              time: new Date(targetTime).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }),
              temperature: Math.round(closest.temperature),
              condition: closest.condition,
              icon: closest.condition_icon || "03d",
            });
          }

          // Only update state if data has actually changed
          const newForecasts = forecasts;
          const newCondition = haEntity.state;

          setForecasts((prevForecasts) => {
            const hasChanged =
              prevForecasts.length !== newForecasts.length ||
              prevForecasts.some(
                (prev, index) =>
                  !newForecasts[index] ||
                  prev.temperature !== newForecasts[index].temperature ||
                  prev.condition !== newForecasts[index].condition ||
                  prev.icon !== newForecasts[index].icon
              );
            return hasChanged ? newForecasts : prevForecasts;
          });

          setCurrentCondition((prevCondition) => (prevCondition !== newCondition ? newCondition : prevCondition));
          setLoading(false);
          return;
        }
      }

      // Fallback: Fetch from OpenWeatherMap API
      if (!openWeatherApiKey) {
        setError("OpenWeather API key not configured. Please add it in Settings.");
        setLoading(false);
        return;
      }

      const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?zip=${zipCode},DE&appid=${openWeatherApiKey}&units=metric`);

      if (response.ok) {
        const data = await response.json();

        // Get 6 forecasts using OpenWeather's 3-hour intervals
        const forecasts: WeatherForecast[] = [];

        for (let i = 0; i < 6; i++) {
          const forecast = data.list[i];
          forecasts.push({
            time: new Date(forecast.dt * 1000).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
            temperature: Math.round(forecast.main.temp),
            condition: forecast.weather[0].main,
            icon: forecast.weather[0].icon,
          });
        }

        // Only update state if data has actually changed
        const newForecasts = forecasts;
        const newCondition = data.list[0].weather[0].main;

        setForecasts((prevForecasts) => {
          const hasChanged =
            prevForecasts.length !== newForecasts.length ||
            prevForecasts.some(
              (prev, index) =>
                !newForecasts[index] ||
                prev.temperature !== newForecasts[index].temperature ||
                prev.condition !== newForecasts[index].condition ||
                prev.icon !== newForecasts[index].icon
            );
          return hasChanged ? newForecasts : prevForecasts;
        });

        setCurrentCondition((prevCondition) => (prevCondition !== newCondition ? newCondition : prevCondition));
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(`Failed to fetch weather data: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error("Failed to fetch weather data:", error);
      setError(`Error fetching weather data: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }, [entityId, zipCode, openWeatherApiKey, lastFetchTime, forecasts.length]);

  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickedSegment?.timeout) {
        clearTimeout(clickedSegment.timeout);
      }
    };
  }, [clickedSegment]);

  const getWeatherIconUrl = useCallback((iconCode: string) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }, []);

  const getWeatherIcon = useCallback((condition: string) => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes("rain")) return <CloudRain className="w-6 h-6 text-blue-400" />;
    if (conditionLower.includes("cloud")) return <Cloud className="w-6 h-6 text-gray-400" />;
    if (conditionLower.includes("sun") || conditionLower.includes("clear")) return <Sun className="w-6 h-6 text-yellow-400" />;
    if (conditionLower.includes("snow")) return <CloudSnow className="w-6 h-6 text-blue-200" />;
    if (conditionLower.includes("drizzle")) return <CloudDrizzle className="w-6 h-6 text-blue-300" />;
    return <Wind className="w-6 h-6 text-gray-400" />;
  }, []);

  const translateCondition = useCallback((condition: string): string => {
    const translations: Record<string, string> = {
      Cloudy: "Bewölkt",
      Clouds: "Bewölkt",
      Clear: "Klar",
      Rain: "Regen",
      Snow: "Schnee",
      Drizzle: "Nieselregen",
      Thunderstorm: "Gewitter",
    };
    return translations[condition] || condition;
  }, []);

  const handleSegmentClick = useCallback(
    (condition: string) => {
      // Clear existing timeout
      if (clickedSegment?.timeout) {
        clearTimeout(clickedSegment.timeout);
      }

      // Set new clicked segment
      const timeout = setTimeout(() => {
        setClickedSegment(null);
      }, 5000);

      setClickedSegment({ condition, timeout });
    },
    [clickedSegment]
  );

  // Memoize condition bar content
  const conditionBarContent = useMemo(() => {
    const groupedForecasts: { icon: string; condition: string; count: number; width: number }[] = [];
    let currentGroup = { icon: forecasts[0]?.icon || "", condition: forecasts[0]?.condition || "", count: 0, width: 0 };

    forecasts.forEach((forecast) => {
      if (forecast.icon === currentGroup.icon && forecast.condition === currentGroup.condition) {
        currentGroup.count++;
      } else {
        if (currentGroup.count > 0) {
          groupedForecasts.push({ ...currentGroup, width: (currentGroup.count / forecasts.length) * 100 });
        }
        currentGroup = { icon: forecast.icon, condition: forecast.condition, count: 1, width: 0 };
      }
    });

    if (currentGroup.count > 0) {
      groupedForecasts.push({ ...currentGroup, width: (currentGroup.count / forecasts.length) * 100 });
    }

    const getBackgroundColor = (condition: string) => {
      const conditionLower = condition.toLowerCase();
      if (conditionLower.includes("rain")) return "bg-blue-500/30";
      if (conditionLower.includes("cloud")) return "bg-gray-500/30";
      if (conditionLower.includes("sun") || conditionLower.includes("clear")) return "bg-yellow-500/30";
      if (conditionLower.includes("snow")) return "bg-blue-200/30";
      if (conditionLower.includes("drizzle")) return "bg-blue-400/30";
      if (conditionLower.includes("thunderstorm")) return "bg-purple-500/30";
      return "bg-gray-600/30";
    };

    return groupedForecasts.map((group, index) => (
      <div
        key={index}
        className={`flex items-center justify-center border-r border-gray-600/30 last:border-r-0 ${getBackgroundColor(
          group.condition
        )} cursor-pointer hover:opacity-80 transition-opacity`}
        style={{ width: `${group.width}%` }}
        onClick={() => handleSegmentClick(group.condition)}
      >
        {clickedSegment?.condition === group.condition ? (
          <span className="text-white text-xs font-medium text-center px-1">{translateCondition(group.condition)}</span>
        ) : (
          <img src={getWeatherIconUrl(group.icon)} alt={group.condition} className="w-10 h-10" />
        )}
      </div>
    ));
  }, [forecasts, clickedSegment, handleSegmentClick, translateCondition, getWeatherIconUrl]);

  // Memoize forecast content
  const forecastContent = useMemo(
    () =>
      forecasts.map((forecast, index) => (
        <div key={index} className="flex flex-col items-center justify-center space-y-0.5">
          <div className="text-gray-400 text-xs">{forecast.time}</div>
          <div className="text-white text-sm font-semibold">{forecast.temperature}°</div>
        </div>
      )),
    [forecasts]
  );

  if (loading) {
    return (
      <Card
        title={title}
        icon={getWeatherIcon("Cloudy")}
        onTitleChange={onTitleChange}
        onJsonSave={onJsonSave}
        onCardDelete={onCardDelete}
        cardConfig={cardConfig}
        entityId={entityId}
        disabled={disabled}
        className={`bg-gradient-to-br from-gray-900/90 to-gray-800/90 ${className}`}
        width="w-full"
        height="h-full"
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-400">Loading...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        title={title}
        icon={<Cloud className="w-6 h-6 text-red-400" />}
        onTitleChange={onTitleChange}
        onJsonSave={onJsonSave}
        onCardDelete={onCardDelete}
        cardConfig={cardConfig}
        entityId={entityId}
        disabled={disabled}
        className={`bg-gradient-to-br from-gray-900/90 to-gray-800/90 ${className}`}
        width="w-full"
        height="h-full"
      >
        <div className="flex flex-col items-center justify-center h-full space-y-2 px-4">
          <div className="text-red-400 text-center text-sm">{error}</div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={title}
      icon={getWeatherIcon(currentCondition)}
      onTitleChange={onTitleChange}
      onJsonSave={onJsonSave}
      onCardDelete={onCardDelete}
      cardConfig={cardConfig}
      entityId={entityId}
      disabled={disabled}
      className={`bg-gradient-to-br from-gray-900/90 to-gray-800/90 ${className}`}
      width="w-full"
      height="h-full"
    >
      <div className="h-full flex flex-col space-y-1.5 -mt-1">
        {/* Condition Bar */}
        <div className="relative w-full h-6 rounded-lg overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 flex">{conditionBarContent}</div>
        </div>

        {/* Hourly Forecast */}
        <div className="grid grid-cols-6 gap-1.5 flex-1 content-start">{forecastContent}</div>
      </div>
    </Card>
  );
};
