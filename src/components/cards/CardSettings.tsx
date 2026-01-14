import React, { useState, useEffect } from "react";
import { X, Save, Settings, Search, Home, Code, Edit3, AlertCircle, Trash2, History } from "lucide-react";
import { useHomeAssistantStore } from "../../store/useHomeAssistantStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { getCardRequirements, validateCardConfig } from "../../types/cardRequirements";

interface CardSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  entityId?: string;
  cardConfig?: any;
  onSave: (title: string, entityId?: string) => void;
  onSaveJson?: (config: any) => void;
  onDelete?: () => void;
}

export const CardSettings: React.FC<CardSettingsProps> = ({ isOpen, onClose, title, entityId = "", cardConfig, onSave, onSaveJson, onDelete }) => {
  const [editedTitle, setEditedTitle] = useState(title);
  const [editedEntityId, setEditedEntityId] = useState(entityId);
  const [entitySearch, setEntitySearch] = useState("");
  const [showEntityList, setShowEntityList] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "json" | "history">("basic");
  const [jsonValue, setJsonValue] = useState(JSON.stringify(cardConfig || {}, null, 2));
  const [jsonError, setJsonError] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [historyData, setHistoryData] = useState<Array<{ time: string; state: string; attributes: any }>>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [plantTab, setPlantTab] = useState(0);
  const [plantsDraft, setPlantsDraft] = useState<any[]>([]);

  const { entities } = useHomeAssistantStore();

  // Get current entity data for display
  const haEntity = editedEntityId ? entities.get(editedEntityId) : null;

  // Fetch history data using REST API
  const fetchHistory = async () => {
    if (!editedEntityId) return;

    setIsLoadingHistory(true);
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

      // Get Home Assistant URL and token from settings
      const { homeAssistantIP, homeAssistantToken } = useSettingsStore.getState();
      if (!homeAssistantIP || !homeAssistantToken) {
        throw new Error("Home Assistant not configured");
      }

      // Build the API URL
      const baseUrl = homeAssistantIP.startsWith("http") ? homeAssistantIP : `http://${homeAssistantIP}`;
      const apiUrl = `${baseUrl}/api/history/period/${startTime.toISOString()}?end_time=${endTime.toISOString()}&filter_entity_id=${editedEntityId}`;

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${homeAssistantToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data && data[0] && data[0].length > 0) {
        const history = data[0];
        const processedData = history.map((entry: any) => ({
          time: new Date(entry.last_changed).toLocaleString(),
          state: entry.state,
          attributes: entry.attributes || {},
        }));
        setHistoryData(processedData);
      } else {
        setHistoryData([]);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
      setHistoryData([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  React.useEffect(() => {
    setEditedTitle(title);
    setEditedEntityId(entityId);
    setJsonValue(JSON.stringify(cardConfig || {}, null, 2));
    setJsonError("");
    setActiveTab("basic");
    setShowDeleteConfirm(false);
    setPlantTab(0);

    if (cardConfig?.type === "plant-sensor") {
      const existing = Array.isArray(cardConfig?.plants) ? cardConfig.plants : [];
      const normalized = Array.from({ length: 3 }).map((_, i) => {
        const p = existing[i] || {};
        return {
          id: p.id || `plant-${i + 1}`,
          name: p.name || `Plant ${i + 1}`,
          batteryEntity: p.batteryEntity || "",
          humidityEntity: p.humidityEntity || "",
          moistureEntity: p.moistureEntity || "",
          temperatureEntity: p.temperatureEntity || "",
          image: p.image || "",
        };
      });
      setPlantsDraft(normalized);
    } else {
      setPlantsDraft([]);
    }
  }, [title, entityId, cardConfig, isOpen]);

  // Fetch history when history tab is opened
  useEffect(() => {
    if (activeTab === "history" && editedEntityId) {
      fetchHistory();
    }
  }, [activeTab, editedEntityId]);

  const handleSave = () => {
    // For plant cards, persist per-plant entity configuration via JSON save,
    // while still updating the title via the regular save callback.
    if (cardConfig?.type === "plant-sensor") {
      const updatedConfig = {
        ...(cardConfig || {}),
        title: editedTitle,
        entityId: editedEntityId || undefined,
        plants: plantsDraft.map((p, i) => ({
          id: p.id || `plant-${i + 1}`,
          name: p.name || `Plant ${i + 1}`,
          batteryEntity: p.batteryEntity || undefined,
          humidityEntity: p.humidityEntity || undefined,
          moistureEntity: p.moistureEntity || undefined,
          temperatureEntity: p.temperatureEntity || undefined,
          image: p.image || undefined,
        })),
      };
      onSaveJson?.(updatedConfig);
    }

    onSave(editedTitle, editedEntityId);
    onClose();
  };

  const updatePlantField = (index: number, field: string, value: string) => {
    setPlantsDraft((prev) => {
      const next = [...prev];
      next[index] = { ...(next[index] || {}), [field]: value };
      return next;
    });
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete?.();
      onClose();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const validateJson = (value: string): boolean => {
    try {
      JSON.parse(value);
      setJsonError("");
      return true;
    } catch (e: any) {
      setJsonError(e.message);
      return false;
    }
  };

  const handleJsonChange = (value: string) => {
    setJsonValue(value);
    validateJson(value);
  };

  const handleSaveJson = () => {
    if (validateJson(jsonValue)) {
      try {
        const parsedConfig = JSON.parse(jsonValue);

        // Validate required fields
        const validation = validateCardConfig(parsedConfig.type, parsedConfig);
        if (!validation.isValid) {
          setJsonError(`Missing required fields: ${validation.missingFields.join(", ")}`);
          return;
        }

        onSaveJson?.(parsedConfig);
        onClose();
      } catch (e: any) {
        setJsonError(e.message);
      }
    }
  };

  // Filter entities based on search
  const filteredEntities = Array.from(entities.values())
    .filter(
      (entity: any) =>
        entity.entity_id.toLowerCase().includes(entitySearch.toLowerCase()) ||
        entity.attributes.friendly_name?.toLowerCase().includes(entitySearch.toLowerCase())
    )
    .slice(0, 20); // Limit to 20 results for performance

  const getEntityIcon = (entity: any) => {
    if (entity.entity_id.startsWith("light.")) return "💡";
    if (entity.entity_id.startsWith("switch.")) return "🔌";
    if (entity.entity_id.startsWith("sensor.")) return "📊";
    if (entity.entity_id.startsWith("binary_sensor.")) return "🔍";
    if (entity.entity_id.startsWith("cover.")) return "🪟";
    if (entity.entity_id.startsWith("climate.")) return "🌡️";
    return "🏠";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSave();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isSaveDisabled = activeTab === "json" && (jsonError !== "" || !jsonValue.trim());

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl w-[600px] max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">Card Settings</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700/50">
          <button
            onClick={() => setActiveTab("basic")}
            className={`flex-1 px-6 py-3 flex items-center justify-center gap-2 transition-colors ${
              activeTab === "basic" ? "bg-blue-500/10 border-b-2 border-blue-500 text-blue-400" : "text-gray-400 hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span className="font-medium">Basic Settings</span>
          </button>
          <button
            onClick={() => setActiveTab("json")}
            className={`flex-1 px-6 py-3 flex items-center justify-center gap-2 transition-colors ${
              activeTab === "json" ? "bg-blue-500/10 border-b-2 border-blue-500 text-blue-400" : "text-gray-400 hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            <Code className="w-4 h-4" />
            <span className="font-medium">JSON Editor</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 px-6 py-3 flex items-center justify-center gap-2 transition-colors ${
              activeTab === "history" ? "bg-blue-500/10 border-b-2 border-blue-500 text-blue-400" : "text-gray-400 hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            <History className="w-4 h-4" />
            <span className="font-medium">History</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {activeTab === "basic" && (
            <>
              {/* Required Fields Info */}
              {cardConfig?.type &&
                (() => {
                  const requirements = getCardRequirements(cardConfig.type);
                  if (requirements && requirements.requiredFields.length > 0) {
                    const validation = validateCardConfig(cardConfig.type, cardConfig);
                    return (
                      <div
                        className={`p-4 rounded-xl border ${
                          validation.isValid ? "bg-green-500/10 border-green-500/30" : "bg-amber-500/10 border-amber-500/30"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${validation.isValid ? "text-green-400" : "text-amber-400"}`} />
                          <div className="flex-1">
                            <h4 className={`font-medium mb-2 ${validation.isValid ? "text-green-300" : "text-amber-300"}`}>
                              {validation.isValid ? "All Required Fields Present" : "Required Fields"}
                            </h4>
                            <ul className="space-y-1 text-sm text-gray-300">
                              {requirements.requiredFields.map((field) => {
                                const isMissing = validation.missingFields.includes(field.label);
                                return (
                                  <li key={field.name} className={`flex items-center gap-2 ${isMissing ? "text-amber-300 font-medium" : "text-gray-400"}`}>
                                    <span className="text-xs">{isMissing ? "⚠️" : "✓"}</span>
                                    <span>{field.label}</span>
                                    {field.description && <span className="text-xs text-gray-500">- {field.description}</span>}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="Enter card title..."
                  autoFocus
                />
              </div>

              {/* Plant Sensor Settings */}
              {cardConfig?.type === "plant-sensor" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Plants</h3>
                    <div className="text-xs text-gray-400">Edit names + entities per plant</div>
                  </div>

                  {/* Plant Tabs */}
                  <div className="flex gap-2">
                    {plantsDraft.map((p, idx) => (
                      <button
                        key={p.id || idx}
                        type="button"
                        onClick={() => setPlantTab(idx)}
                        className={`px-3 py-2 rounded-xl border transition-colors text-sm ${
                          plantTab === idx
                            ? "bg-blue-500/10 border-blue-500/40 text-blue-300"
                            : "bg-gray-800/30 border-gray-700/50 text-gray-300 hover:bg-white/5"
                        }`}
                        title={p.name}
                      >
                        {p.name || `Plant ${idx + 1}`}
                      </button>
                    ))}
                  </div>

                  {/* Plant Editor */}
                  {plantsDraft[plantTab] && (
                    <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Plant Name</label>
                          <input
                            type="text"
                            value={plantsDraft[plantTab].name}
                            onChange={(e) => updatePlantField(plantTab, "name", e.target.value)}
                            className="w-full px-4 py-3 bg-gray-900/40 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                            placeholder="Monstera"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Battery Entity</label>
                          <input
                            type="text"
                            value={plantsDraft[plantTab].batteryEntity}
                            onChange={(e) => updatePlantField(plantTab, "batteryEntity", e.target.value)}
                            className="w-full px-4 py-3 bg-gray-900/40 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                            placeholder="sensor.blumen_giessen_1_battery"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Humidity Entity</label>
                          <input
                            type="text"
                            value={plantsDraft[plantTab].humidityEntity}
                            onChange={(e) => updatePlantField(plantTab, "humidityEntity", e.target.value)}
                            className="w-full px-4 py-3 bg-gray-900/40 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                            placeholder="sensor.blumen_giessen_1_humidity"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Soil Moisture Entity</label>
                          <input
                            type="text"
                            value={plantsDraft[plantTab].moistureEntity}
                            onChange={(e) => updatePlantField(plantTab, "moistureEntity", e.target.value)}
                            className="w-full px-4 py-3 bg-gray-900/40 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                            placeholder="sensor.blumen_giessen_1_soil_moisture"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Temperature Entity</label>
                          <input
                            type="text"
                            value={plantsDraft[plantTab].temperatureEntity}
                            onChange={(e) => updatePlantField(plantTab, "temperatureEntity", e.target.value)}
                            className="w-full px-4 py-3 bg-gray-900/40 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                            placeholder="sensor.blumen_giessen_1_temperature"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Image URL (optional)</label>
                          <input
                            type="text"
                            value={plantsDraft[plantTab].image}
                            onChange={(e) => updatePlantField(plantTab, "image", e.target.value)}
                            className="w-full px-4 py-3 bg-gray-900/40 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Entity Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Home Assistant Entity (Optional)</label>
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={entitySearch}
                        onChange={(e) => {
                          setEntitySearch(e.target.value);
                          setShowEntityList(e.target.value.length > 0);
                        }}
                        onFocus={() => setShowEntityList(entitySearch.length > 0)}
                        onKeyDown={handleKeyDown}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                        placeholder="Search for Home Assistant entities..."
                      />
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditedEntityId("");
                        setEntitySearch("");
                        setShowEntityList(false);
                      }}
                      className="px-3 py-2 bg-gray-700/50 text-gray-300 rounded-lg transition-colors"
                      title="Clear entity selection"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Entity List Dropdown */}
                  {showEntityList && (
                    <div className="absolute z-10 w-full mt-2 bg-gray-800/95 backdrop-blur-xl border border-gray-600/50 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                      {filteredEntities.length > 0 ? (
                        filteredEntities.map((entity: any) => (
                          <button
                            key={entity.entity_id}
                            onClick={() => {
                              setEditedEntityId(entity.entity_id);
                              setEntitySearch(entity.attributes.friendly_name || entity.entity_id);
                              setShowEntityList(false);
                            }}
                            className="w-full px-4 py-3 text-left transition-colors border-b border-gray-700/50 last:border-b-0"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{getEntityIcon(entity)}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-white font-medium truncate">{entity.attributes.friendly_name || entity.entity_id}</div>
                                <div className="text-gray-400 text-sm truncate">{entity.entity_id}</div>
                                <div className="text-gray-500 text-xs">State: {entity.state}</div>
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-gray-400">
                          <Home className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No entities found</p>
                          <p className="text-xs mt-1">Try a different search term</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Entity Display */}
                {editedEntityId && (
                  <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-green-300">
                      <Home className="w-4 h-4" />
                      <span className="text-sm font-medium">Linked to Home Assistant</span>
                    </div>
                    <div className="text-green-200 text-sm mt-1">{editedEntityId}</div>

                    {/* Entity State and Attributes */}
                    {haEntity ? (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-green-300 font-medium">Current State:</div>
                          <div className="text-xs text-green-400">Updated: {new Date(haEntity.last_updated).toLocaleTimeString()}</div>
                        </div>
                        <div className="text-green-200 text-sm font-mono bg-green-500/20 px-2 py-1 rounded">{haEntity.state}</div>

                        {Object.keys(haEntity.attributes).length > 0 && (
                          <>
                            <div className="text-xs text-green-300 font-medium">Attributes:</div>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {Object.entries(haEntity.attributes)
                                .filter(([key]) => !["friendly_name", "entity_picture"].includes(key))
                                .slice(0, 10)
                                .map(([key, value]) => (
                                  <div key={key} className="flex justify-between text-xs">
                                    <span className="text-green-200 truncate mr-2">{key}:</span>
                                    <span className="text-green-100 font-mono text-right">
                                      {typeof value === "object"
                                        ? JSON.stringify(value).slice(0, 30) + (JSON.stringify(value).length > 30 ? "..." : "")
                                        : String(value).slice(0, 30) + (String(value).length > 30 ? "..." : "")}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                        <div className="text-xs text-yellow-300">Entity not found or not connected to Home Assistant</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Keyboard Shortcuts Info */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="text-sm text-blue-300">
                  <div className="font-medium mb-1">Keyboard Shortcuts:</div>
                  <div>
                    • <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Ctrl + Enter</kbd> to save
                  </div>
                  <div>
                    • <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Escape</kbd> to cancel
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "json" && (
            <>
              {/* JSON Editor */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Card Configuration (JSON)</label>
                  <textarea
                    value={jsonValue}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    className="w-full h-[400px] px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-mono text-sm resize-none"
                    placeholder="Enter JSON configuration..."
                    spellCheck={false}
                  />
                </div>

                {/* JSON Error Display */}
                {jsonError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-red-300 mb-1">JSON Validation Error</div>
                        <div className="text-sm text-red-200 font-mono">{jsonError}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* JSON Valid Indicator */}
                {!jsonError && jsonValue.trim() && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      <span className="text-sm text-green-300">JSON is valid</span>
                    </div>
                  </div>
                )}

                {/* Info Box */}
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                  <div className="text-sm text-yellow-300">
                    <div className="font-medium mb-2">⚠️ Advanced Editor</div>
                    <div className="space-y-1 text-xs">
                      <div>• Edit the raw JSON configuration of this card</div>
                      <div>• Changes will be validated before saving</div>
                      <div>• Invalid JSON cannot be saved</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "history" && (
            <>
              {/* History Tab */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Entity History</h3>
                  <button
                    onClick={fetchHistory}
                    disabled={isLoadingHistory}
                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <History className="w-4 h-4" />
                    {isLoadingHistory ? "Loading..." : "Refresh"}
                  </button>
                </div>

                {!editedEntityId ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                    <div className="text-sm text-yellow-300">
                      <div className="font-medium mb-1">No Entity Selected</div>
                      <div>Please select an entity to view its history.</div>
                    </div>
                  </div>
                ) : isLoadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-400">Loading history...</span>
                  </div>
                ) : historyData.length === 0 ? (
                  <div className="bg-gray-500/10 border border-gray-500/20 rounded-xl p-4">
                    <div className="text-sm text-gray-300">
                      <div className="font-medium mb-1">No History Data</div>
                      <div>No state changes found for this entity in the last 24 hours.</div>
                      <div className="text-xs text-gray-400 mt-2">
                        Make sure the Recorder integration is enabled in Home Assistant and this entity has history tracking enabled.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800/50 border border-gray-600/50 rounded-xl overflow-hidden">
                    {/* History Graph */}
                    <div className="h-64 p-4">
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {/* Grid lines */}
                        <defs>
                          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                          </pattern>
                        </defs>
                        <rect width="100" height="100" fill="url(#grid)" />

                        {/* Y-axis labels */}
                        {[0, 25, 50, 75, 100].map((value) => (
                          <text key={value} x="2" y={100 - value + 2} fontSize="3" fill="rgba(255,255,255,0.6)" textAnchor="start">
                            {value}%
                          </text>
                        ))}

                        {/* X-axis labels */}
                        {[0, 25, 50, 75, 100].map((value) => {
                          const time = new Date(Date.now() - ((100 - value) * 24 * 60 * 60 * 1000) / 100);
                          return (
                            <text key={value} x={value} y="98" fontSize="2.5" fill="rgba(255,255,255,0.6)" textAnchor="middle">
                              {time.getHours().toString().padStart(2, "0")}:{time.getMinutes().toString().padStart(2, "0")}
                            </text>
                          );
                        })}

                        {/* Process data for graph */}
                        {(() => {
                          if (historyData.length === 0) return null;

                          // Convert history data to numeric values and normalize
                          const numericData = historyData
                            .map((entry) => {
                              const value = parseFloat(entry.state);
                              return isNaN(value) ? null : value;
                            })
                            .filter((value) => value !== null);

                          if (numericData.length === 0) return null;

                          const minValue = Math.min(...numericData);
                          const maxValue = Math.max(...numericData);
                          const valueRange = maxValue - minValue;

                          // Generate path points
                          const pathPoints = historyData
                            .map((entry, index) => {
                              const value = parseFloat(entry.state);
                              if (isNaN(value)) return null;

                              const x = (index / (historyData.length - 1)) * 100;
                              const y = valueRange > 0 ? 100 - ((value - minValue) / valueRange) * 100 : 50;
                              return `${index === 0 ? "M" : "L"} ${x},${y}`;
                            })
                            .filter((point) => point !== null);

                          const pathData = pathPoints.join(" ");

                          return (
                            <>
                              {/* Area under the line */}
                              <path d={`${pathData} L 100,100 L 0,100 Z`} fill="rgba(59, 130, 246, 0.2)" className="transition-all duration-1000" />

                              {/* Main line */}
                              <path d={pathData} stroke="rgb(59, 130, 246)" strokeWidth="0.5" fill="none" className="transition-all duration-1000" />

                              {/* Data points */}
                              {historyData.map((entry, index) => {
                                const value = parseFloat(entry.state);
                                if (isNaN(value)) return null;

                                const x = (index / (historyData.length - 1)) * 100;
                                const y = valueRange > 0 ? 100 - ((value - minValue) / valueRange) * 100 : 50;

                                return <circle key={index} cx={x} cy={y} r="1" fill="rgb(59, 130, 246)" className="transition-all duration-1000" />;
                              })}
                            </>
                          );
                        })()}
                      </svg>
                    </div>

                    {/* Data summary */}
                    <div className="p-4 border-t border-gray-700/50">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-xs text-gray-400">Data Points</div>
                          <div className="text-sm font-semibold text-white">{historyData.length}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400">Current Value</div>
                          <div className="text-sm font-semibold text-white">{historyData.length > 0 ? historyData[historyData.length - 1].state : "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400">Time Range</div>
                          <div className="text-sm font-semibold text-white">24h</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info Box */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="text-sm text-blue-300">
                    <div className="font-medium mb-2">📊 History Information</div>
                    <div className="space-y-1 text-xs">
                      <div>• Shows state changes for the last 24 hours</div>
                      <div>• Data is fetched from Home Assistant's history API</div>
                      <div>• Only entities with history tracking enabled will show data</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700/50">
          {/* Delete Button */}
          {onDelete && (
            <button
              onClick={handleDelete}
              className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                showDeleteConfirm
                  ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg hover:shadow-red-500/50 hover:scale-105"
                  : "text-red-400 hover:bg-red-500/10 hover:text-red-300"
              }`}
            >
              <Trash2 className="w-4 h-4" />
              {showDeleteConfirm ? "Click Again to Confirm" : "Remove Card"}
            </button>
          )}

          {/* Save/Cancel Buttons */}
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-gray-300 transition-colors">
              Cancel
            </button>
            <button
              onClick={activeTab === "json" ? handleSaveJson : handleSave}
              disabled={isSaveDisabled}
              className={`px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg ${
                isSaveDisabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-xl hover:scale-105"
              }`}
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
