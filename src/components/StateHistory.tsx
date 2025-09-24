import React, { useState, useEffect } from "react";
import { X, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { EntityState } from "../types/homeassistant";

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

  useEffect(() => {
    if (isOpen && entity) {
      loadStateHistory();
    }
  }, [isOpen, entity]);

  const loadStateHistory = async () => {
    setIsLoading(true);
    try {
      // Simulate loading state history
      // In a real implementation, you would call Home Assistant's history API
      const mockHistory = generateMockHistory(entity);
      setHistory(mockHistory);
    } catch (error) {
      console.error("Failed to load state history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockHistory = (entity: EntityState): StateChange[] => {
    const now = new Date();
    const history: StateChange[] = [];

    // Generate mock historical data
    for (let i = 24; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000); // Every hour for 24 hours
      const baseValue = parseFloat(entity.state) || 0;
      const variation = (Math.random() - 0.5) * 10; // ±5 variation
      const newValue = Math.max(0, baseValue + variation);

      let changeType: StateChange["changeType"] = "initial";
      if (i < 24) {
        const prevValue = parseFloat(history[history.length - 1]?.state || entity.state);
        if (newValue > prevValue) changeType = "increase";
        else if (newValue < prevValue) changeType = "decrease";
        else changeType = "change";
      }

      history.push({
        timestamp,
        state: entity.entity_id.includes("temperature") ? newValue.toFixed(1) : Math.round(newValue).toString(),
        oldState: i < 24 ? history[history.length - 1]?.state : undefined,
        changeType,
      });
    }

    return history.reverse(); // Show oldest first
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{entity.attributes?.friendly_name || entity.entity_id}</h2>
            <p className="text-sm text-gray-500">State History (24 hours)</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
