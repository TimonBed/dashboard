import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SettingsState {
  homeAssistantIP: string;
  homeAssistantToken: string;
  openWeatherApiKey: string;
  autoConnect: boolean;
}

interface SettingsActions {
  updateSettings: (settings: Partial<SettingsState>) => void;
  resetSettings: () => void;
  getHomeAssistantURL: () => string;
}

const defaultSettings: SettingsState = {
  homeAssistantIP: import.meta.env.VITE_HA_URL || "",
  homeAssistantToken: import.meta.env.VITE_HA_TOKEN || "",
  openWeatherApiKey: import.meta.env.VITE_OPENWEATHER_API_KEY || "",
  autoConnect: true,
};

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set, get) => ({
      ...defaultSettings,

      updateSettings: (newSettings) => {
        set((state) => ({
          ...state,
          ...newSettings,
        }));
      },

      resetSettings: () => {
        set(defaultSettings);
      },

      getHomeAssistantURL: () => {
        const { homeAssistantIP } = get();
        if (!homeAssistantIP) return "";

        // If it's already a full URL, return as is
        if (homeAssistantIP.startsWith("http")) {
          return homeAssistantIP;
        }

        // Check if port is already included
        const hasPort = homeAssistantIP.includes(":");
        const isDomain = homeAssistantIP.includes(".") || homeAssistantIP === "localhost";
        const protocol = homeAssistantIP === "localhost" ? "http" : "https";

        if (hasPort) {
          // Port is already included, just add protocol
          return `${protocol}://${homeAssistantIP}`;
        } else if (isDomain) {
          // Domain without port, use default ports
          return `${protocol}://${homeAssistantIP}`;
        } else {
          // IP address without port, add default port
          return `${protocol}://${homeAssistantIP}:80`;
        }
      },
    }),
    {
      name: "dashboard-settings",
      version: 1,
    }
  )
);
