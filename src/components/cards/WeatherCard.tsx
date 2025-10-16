import React, { useState, useEffect } from "react";
import { Cloud, CloudRain, Sun, CloudSnow, CloudDrizzle, Wind } from "lucide-react";
import { Card } from "./Card";
import { useHomeAssistantStore } from "../../store/useHomeAssistantStore";

interface WeatherForecast {
  time: string;
  temperature: number;
  condition: string;
}

interface WeatherCardProps {
  title?: string;
  entityId?: string;
  zipCode?: string;
  onTitleChange?: (title: string, entityId?: string) => void;
  onJsonSave?: (config: any) => void;
  cardConfig?: any;
  disabled?: boolean;
  className?: string;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  title = "Weather",
  entityId,
  zipCode = "21033",
  onTitleChange,
  onJsonSave,
  cardConfig,
  disabled = false,
  className = "",
}) => {
  const { entities } = useHomeAssistantStore();
  const [forecasts, setForecasts] = useState<WeatherForecast[]>([]);
  const [currentCondition, setCurrentCondition] = useState<string>("Cloudy");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeatherData();
  }, [entityId, zipCode]);

  const fetchWeatherData = async () => {
    try {
      // First, try to get data from Home Assistant weather entity
      if (entityId) {
        const haEntity = entities.get(entityId);
        if (haEntity && haEntity.attributes.forecast) {
          const haForecasts = haEntity.attributes.forecast.slice(0, 6).map((f: any) => ({
            time: new Date(f.datetime).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
            temperature: Math.round(f.temperature),
            condition: f.condition,
          }));
          setForecasts(haForecasts);
          setCurrentCondition(haEntity.state);
          setLoading(false);
          return;
        }
      }

      // Fallback: Fetch from OpenWeatherMap API
      const API_KEY = "YOUR_OPENWEATHERMAP_API_KEY"; // Replace with actual API key
      const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?zip=${zipCode},US&appid=${API_KEY}&units=metric`);

      if (response.ok) {
        const data = await response.json();
        const hourlyForecasts = data.list.slice(0, 6).map((item: any) => ({
          time: new Date(item.dt * 1000).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          temperature: Math.round(item.main.temp),
          condition: item.weather[0].main,
        }));
        setForecasts(hourlyForecasts);
        setCurrentCondition(data.list[0].weather[0].main);
      } else {
        // If API fails, use mock data for demo
        generateMockForecasts();
      }
    } catch (error) {
      console.error("Failed to fetch weather data:", error);
      generateMockForecasts();
    } finally {
      setLoading(false);
    }
  };

  const generateMockForecasts = () => {
    const now = new Date();
    const mockForecasts: WeatherForecast[] = [];

    for (let i = 0; i < 6; i++) {
      const forecastTime = new Date(now.getTime() + i * 2 * 60 * 60 * 1000);
      mockForecasts.push({
        time: forecastTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        temperature: Math.round(10 + Math.random() * 5),
        condition: "Cloudy",
      });
    }

    setForecasts(mockForecasts);
    setCurrentCondition("Cloudy");
  };

  const getWeatherIcon = (condition: string) => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes("rain")) return <CloudRain className="w-5 h-5 text-blue-400" />;
    if (conditionLower.includes("cloud")) return <Cloud className="w-5 h-5 text-gray-400" />;
    if (conditionLower.includes("sun") || conditionLower.includes("clear")) return <Sun className="w-5 h-5 text-yellow-400" />;
    if (conditionLower.includes("snow")) return <CloudSnow className="w-5 h-5 text-blue-200" />;
    if (conditionLower.includes("drizzle")) return <CloudDrizzle className="w-5 h-5 text-blue-300" />;
    return <Wind className="w-5 h-5 text-gray-400" />;
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

  return (
    <Card
      title={title}
      icon={getWeatherIcon(currentCondition)}
      onTitleChange={onTitleChange}
      onJsonSave={onJsonSave}
      cardConfig={cardConfig}
      entityId={entityId}
      disabled={disabled}
      className={`bg-gradient-to-br from-gray-900/90 to-gray-800/90 ${className}`}
      width="w-full"
      height="h-full"
    >
      <div className="h-full flex flex-col space-y-3 -mt-2">
        {/* Condition Bar */}
        <div className="relative w-full h-8 bg-gradient-to-r from-gray-700/40 via-blue-500/30 to-gray-700/40 rounded-lg overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-sm font-medium">{translateCondition(currentCondition)}</span>
          </div>
        </div>

        {/* Hourly Forecast */}
        <div className="grid grid-cols-6 gap-2 flex-1 content-start">
          {forecasts.map((forecast, index) => (
            <div key={index} className="flex flex-col items-center space-y-1">
              <div className="text-gray-400 text-xs">{forecast.time}</div>
              <div className="text-white text-base font-semibold">{forecast.temperature}°</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
