import React, { useState, useEffect } from "react";
import { Cloud, CloudRain, Sun, CloudSnow, CloudDrizzle, Wind } from "lucide-react";
import { Card } from "./Card";
import { useHomeAssistantStore } from "../../store/useHomeAssistantStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { CardComponentProps } from "../../types/cardProps";

interface WeatherForecast {
  time: string;
  temperature: number;
  condition: string;
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
  const { entities } = useHomeAssistantStore();
  const { openWeatherApiKey } = useSettingsStore();
  const [forecasts, setForecasts] = useState<WeatherForecast[]>([]);
  const [currentCondition, setCurrentCondition] = useState<string>("Cloudy");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeatherData();
  }, [entityId, zipCode, openWeatherApiKey]);

  const fetchWeatherData = async () => {
    setError(null);
    setLoading(true);

    try {
      // First, try to get data from Home Assistant weather entity
      if (entityId) {
        const haEntity = entities.get(entityId);
        if (haEntity && haEntity.attributes.forecast) {
          // Get 6 forecasts over 12 hours (every 2 hours)
          const forecasts: WeatherForecast[] = [];
          const now = Date.now();

          for (let i = 0; i < 6; i++) {
            const targetTime = now + i * 2 * 60 * 60 * 1000; // Every 2 hours

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
            });
          }

          setForecasts(forecasts);
          setCurrentCondition(haEntity.state);
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

        // Get 6 forecasts over 12 hours (every 2 hours)
        // OpenWeather provides 3-hour intervals, so we'll interpolate
        const forecasts: WeatherForecast[] = [];
        const now = Date.now();

        for (let i = 0; i < 6; i++) {
          const targetTime = now + i * 2 * 60 * 60 * 1000; // Every 2 hours

          // Find the closest forecast point
          const closest = data.list.reduce((prev: any, curr: any) => {
            const prevDiff = Math.abs(prev.dt * 1000 - targetTime);
            const currDiff = Math.abs(curr.dt * 1000 - targetTime);
            return currDiff < prevDiff ? curr : prev;
          });

          forecasts.push({
            time: new Date(targetTime).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
            temperature: Math.round(closest.main.temp),
            condition: closest.weather[0].main,
          });
        }

        setForecasts(forecasts);
        setCurrentCondition(data.list[0].weather[0].main);
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
  };

  const getWeatherIcon = (condition: string) => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes("rain")) return <CloudRain className="w-4 h-4 text-blue-400" />;
    if (conditionLower.includes("cloud")) return <Cloud className="w-4 h-4 text-gray-400" />;
    if (conditionLower.includes("sun") || conditionLower.includes("clear")) return <Sun className="w-4 h-4 text-yellow-400" />;
    if (conditionLower.includes("snow")) return <CloudSnow className="w-4 h-4 text-blue-200" />;
    if (conditionLower.includes("drizzle")) return <CloudDrizzle className="w-4 h-4 text-blue-300" />;
    return <Wind className="w-4 h-4 text-gray-400" />;
  };

  const translateCondition = (condition: string): string => {
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
  };

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
        icon={<Cloud className="w-4 h-4 text-red-400" />}
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
        <div className="relative w-full h-6 bg-gradient-to-r from-gray-700/40 via-blue-500/30 to-gray-700/40 rounded-lg overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-xs font-medium">{translateCondition(currentCondition)}</span>
          </div>
        </div>

        {/* Hourly Forecast */}
        <div className="grid grid-cols-6 gap-1.5 flex-1 content-start">
          {forecasts.map((forecast, index) => (
            <div key={index} className="flex flex-col items-center justify-center space-y-0.5">
              <div className="text-gray-400 text-xs">{forecast.time}</div>
              <div className="text-white text-sm font-semibold">{forecast.temperature}°</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
