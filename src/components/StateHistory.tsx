import React, { useState, useEffect, useRef } from "react";
import { X, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { EntityState } from "../types/homeassistant";
import { HistoryService, HistoryState } from "../services/historyService";
import { useSettingsStore } from "../store/useSettingsStore";

interface StateHistoryProps {
  entity: EntityState;
  isOpen: boolean;
  onClose: () => void;
}

interface StateChange {
  timestamp: Date;
  state: string;
  oldState?: string;
  changeType: "increase" | "decrease" | "change" | "initial";
}

export const StateHistory: React.FC<StateHistoryProps> = ({ entity, isOpen, onClose }) => {
  const [history, setHistory] = useState<StateChange[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { homeAssistantIP, homeAssistantToken, getHomeAssistantURL } = useSettingsStore();

  // Ref to store the initial history from API
  const initialHistoryRef = useRef<HistoryState[]>([]);
  const lastEntityStateRef = useRef<string | undefined>(undefined);
  const hasLoadedInitialHistory = useRef<boolean>(false);

  // Load initial history only once when modal opens
  useEffect(() => {
    if (isOpen && entity && !hasLoadedInitialHistory.current) {
      loadInitialHistory();
      hasLoadedInitialHistory.current = true;
    }
  }, [isOpen]);

  // Reset flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasLoadedInitialHistory.current = false;
    }
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  const loadInitialHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!homeAssistantIP || !homeAssistantToken) {
        throw new Error("Home Assistant settings not configured");
      }

      const baseUrl = getHomeAssistantURL();
      if (!baseUrl) {
        throw new Error("Invalid Home Assistant URL");
      }

      const historyService = new HistoryService(baseUrl, homeAssistantToken);

      // Test connection first with the specific entity
      const connectionTest = await historyService.testConnection(entity.entity_id);

      if (!connectionTest.success) {
        throw new Error(`API connection failed: ${connectionTest.message}`);
      }

      const historyStates = await historyService.getStateChanges(entity.entity_id, 48);

      // Store initial history in ref
      initialHistoryRef.current = historyStates;

      if (historyStates.length === 0) {
        setHistory([]);
        return;
      }

      // Convert Home Assistant history format to our StateChange format
      const stateChanges = convertHistoryToStateChanges(historyStates);
      setHistory(stateChanges);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load history");
      // Fallback to empty history on error
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Update history when entity state changes via WebSocket
  useEffect(() => {
    if (isOpen && initialHistoryRef.current.length > 0) {
      // Only add if state has actually changed
      if (lastEntityStateRef.current !== entity.state) {
        lastEntityStateRef.current = entity.state;

        const now = new Date();
        const newState: HistoryState = {
          last_changed: now.toISOString(),
          last_updated: now.toISOString(),
          state: entity.state,
          attributes: entity.attributes || {},
        };

        // Stack the new state on top of existing history
        const updatedHistory = [...initialHistoryRef.current, newState];
        initialHistoryRef.current = updatedHistory;

        const stateChanges = convertHistoryToStateChanges(updatedHistory);
        setHistory(stateChanges);
      }
    }
  }, [entity.state, isOpen]);

  const convertHistoryToStateChanges = (historyStates: HistoryState[]): StateChange[] => {
    const stateChanges: StateChange[] = [];

    for (let i = 0; i < historyStates.length; i++) {
      const currentState = historyStates[i];
      const previousState = i > 0 ? historyStates[i - 1] : null;

      let changeType: StateChange["changeType"] = "initial";
      if (previousState) {
        const currentValue = parseFloat(currentState.state);
        const previousValue = parseFloat(previousState.state);

        if (!isNaN(currentValue) && !isNaN(previousValue)) {
          if (currentValue > previousValue) changeType = "increase";
          else if (currentValue < previousValue) changeType = "decrease";
          else changeType = "change";
        } else {
          // For non-numeric states, just mark as change
          changeType = currentState.state !== previousState.state ? "change" : "initial";
        }
      }

      stateChanges.push({
        timestamp: new Date(currentState.last_changed),
        state: currentState.state,
        oldState: previousState?.state,
        changeType,
      });
    }

    return stateChanges;
  };

  const getChangeIcon = (changeType: StateChange["changeType"]) => {
    switch (changeType) {
      case "increase":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "decrease":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case "change":
        return <Minus className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString();
  };

  const getUnit = () => {
    return entity.attributes?.unit_of_measurement || "";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{entity.attributes?.friendly_name || entity.entity_id}</h2>
            <p className="text-sm text-gray-500">State History (48 hours)</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-gray-800" title="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-red-600 text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading History</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button onClick={loadInitialHistory} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Try Again
                </button>
              </div>
            </div>
          ) : history.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No History Available</h3>
                <p className="text-gray-600">No state changes found for this entity in the last 24 hours.</p>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="p-4 space-y-2">
                {history.map((change, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      {getChangeIcon(change.changeType)}
                      <div>
                        <div className="font-medium text-gray-900">
                          {change.state} {getUnit()}
                        </div>
                        <div className="text-sm text-gray-500">{formatTimestamp(change.timestamp)}</div>
                      </div>
                    </div>
                    {change.oldState && (
                      <div className="text-sm text-gray-500">
                        from {change.oldState} {getUnit()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Total changes: {history.length}</span>
            <span>Last updated: {entity.last_updated ? new Date(entity.last_updated).toLocaleString() : "Unknown"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
