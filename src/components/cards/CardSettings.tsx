import React, { useState } from "react";
import { X, Save, Settings, Search, Home, Code, Edit3, AlertCircle } from "lucide-react";
import { useHomeAssistantStore } from "../../store/useHomeAssistantStore";

interface CardSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  entityId?: string;
  cardConfig?: any;
  onSave: (title: string, entityId?: string) => void;
  onSaveJson?: (config: any) => void;
}

export const CardSettings: React.FC<CardSettingsProps> = ({ isOpen, onClose, title, entityId = "", cardConfig, onSave, onSaveJson }) => {
  const [editedTitle, setEditedTitle] = useState(title);
  const [editedEntityId, setEditedEntityId] = useState(entityId);
  const [entitySearch, setEntitySearch] = useState("");
  const [showEntityList, setShowEntityList] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "json">("basic");
  const [jsonValue, setJsonValue] = useState(JSON.stringify(cardConfig || {}, null, 2));
  const [jsonError, setJsonError] = useState<string>("");

  const { entities } = useHomeAssistantStore();

  // Get current entity data for display
  const haEntity = editedEntityId ? entities.get(editedEntityId) : null;

  React.useEffect(() => {
    setEditedTitle(title);
    setEditedEntityId(entityId);
    setJsonValue(JSON.stringify(cardConfig || {}, null, 2));
    setJsonError("");
    setActiveTab("basic");
  }, [title, entityId, cardConfig, isOpen]);

  const handleSave = () => {
    onSave(editedTitle, editedEntityId);
    onClose();
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
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {activeTab === "basic" && (
            <>
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700/50">
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
  );
};
