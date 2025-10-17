import React, { useState } from "react";
import { Settings, Save, Wifi, Eye, EyeOff, Cloud } from "lucide-react";
import { useSettingsStore } from "../store/useSettingsStore";

export const SettingsPage: React.FC = () => {
  const { homeAssistantIP, homeAssistantToken, openWeatherApiKey, autoConnect, updateSettings } = useSettingsStore();

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Save settings using the store
  const saveSettings = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Settings are automatically saved by the store
      setSaveMessage("Settings saved successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveMessage("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    updateSettings({ [field]: value });
  };

  const validateHost = (host: string): boolean => {
    if (!host) return true; // Allow empty for optional validation

    // Remove protocol if present
    const cleanHost = host.replace(/^https?:\/\//, "");

    // Split host and port
    const [hostPart, portPart] = cleanHost.split(":");

    // IP address validation
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    // Domain validation (more comprehensive)
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;

    // Validate host part
    const isHostValid = ipRegex.test(hostPart) || domainRegex.test(hostPart) || hostPart === "localhost";

    // If port is provided, validate it
    if (portPart) {
      const port = parseInt(portPart, 10);
      const isPortValid = port >= 1 && port <= 65535;
      return isHostValid && isPortValid;
    }

    return isHostValid;
  };

  const isHostValid = homeAssistantIP === "" || validateHost(homeAssistantIP);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Settings className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-gray-600">Configure your dashboard settings and Home Assistant connection.</p>
        </div>

        {/* Settings Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveSettings();
            }}
          >
            {/* Home Assistant Connection Section */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <Wifi className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Home Assistant Connection</h2>
              </div>

              {/* Host and Port Input */}
              <div className="mb-6">
                <label htmlFor="ha-host" className="block text-sm font-medium text-gray-700 mb-2">
                  Home Assistant Address *
                </label>
                <input
                  id="ha-host"
                  type="text"
                  value={homeAssistantIP}
                  onChange={(e) => handleInputChange("homeAssistantIP", e.target.value)}
                  placeholder="192.168.1.100:80, ha.bedynek.org, https://ha.bedynek.org, or localhost"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                    !isHostValid ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
                  }`}
                  required
                />
                {!isHostValid && <p className="mt-1 text-sm text-red-600">Please enter a valid address (IP:port, domain:port, URL, or localhost)</p>}
              </div>

              {/* Token Input */}
              <div className="mb-6">
                <label htmlFor="ha-token" className="block text-sm font-medium text-gray-700 mb-2">
                  Long-Lived Access Token
                </label>
                <div className="relative">
                  <input
                    id="ha-token"
                    type={showToken ? "text" : "password"}
                    value={homeAssistantToken}
                    onChange={(e) => handleInputChange("homeAssistantToken", e.target.value)}
                    placeholder="Enter your Home Assistant token"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">Generate a token in Home Assistant: Profile → Long-lived access tokens</p>
              </div>

              {/* Auto Connect Toggle */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={autoConnect}
                    onChange={(e) => handleInputChange("autoConnect", e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Auto-connect on startup</span>
                </label>
                <p className="mt-1 text-sm text-gray-500">Automatically attempt to connect to Home Assistant when the dashboard loads</p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div>{saveMessage && <p className={`text-sm ${saveMessage.includes("successfully") ? "text-green-600" : "text-red-600"}`}>{saveMessage}</p>}</div>
              <button
                type="submit"
                disabled={isSaving || !isHostValid}
                className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
                  isSaving || !isHostValid
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                }`}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* API Keys Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Cloud className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">API Keys</h2>
          </div>

          {/* OpenWeather API Key */}
          <div className="mb-6">
            <label htmlFor="openweather-api-key" className="block text-sm font-medium text-gray-700 mb-2">
              OpenWeather API Key
            </label>
            <div className="relative">
              <input
                id="openweather-api-key"
                type={showApiKey ? "text" : "password"}
                value={openWeatherApiKey}
                onChange={(e) => handleInputChange("openWeatherApiKey", e.target.value)}
                placeholder="Enter your OpenWeather API key"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Get your free API key at{" "}
              <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                openweathermap.org
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
