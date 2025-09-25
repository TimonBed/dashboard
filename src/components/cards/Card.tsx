import React, { useState, forwardRef } from "react";
import { CardSettings } from "./CardSettings";

interface CardProps {
  title: string;
  subtitle?: string | React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
  onTitleChange?: (title: string, entityId?: string) => void;
  entityId?: string;
  disabled?: boolean;
  className?: string;
  width?: string;
  height?: string;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ title, subtitle, icon, children, onClick, onTitleChange, entityId, disabled = false, width = "w-80", height = "h-16", onMouseDown }, ref) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [currentTitle, setCurrentTitle] = useState(title);
    const [currentEntityId, setCurrentEntityId] = useState(entityId);

    React.useEffect(() => {
      setCurrentTitle(title);
      setCurrentEntityId(entityId);
    }, [title, entityId]);

    const handleRightClick = (e: React.MouseEvent) => {
      e.preventDefault();
      if (!disabled && onTitleChange) {
        setIsSettingsOpen(true);
      }
    };

    const handleSaveSettings = (newTitle: string, newEntityId?: string) => {
      setCurrentTitle(newTitle);
      setCurrentEntityId(newEntityId);
      onTitleChange?.(newTitle, newEntityId);
    };

    return (
      <>
        <div
          ref={ref}
          className={`bg-[#1D1D1D] backdrop-blur-xl w-full rounded-2xl shadow-2xl transition-all duration-500 group relative overflow-hidden ${
            onClick ? "cursor-pointer" : ""
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${width} ${height}  p-3`}
          onClick={disabled ? undefined : onClick}
          onMouseDown={disabled ? undefined : onMouseDown}
          onContextMenu={handleRightClick}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4 ">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="p-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                  <div className="w-5 h-5 flex items-center justify-center">{icon}</div>
                </div>
              )}
              <div>
                <h3 className={`text-white font-semibold  truncate`}>{currentTitle}</h3>
                {subtitle && <div className="text-gray-400 text-xs truncate">{typeof subtitle === "string" ? <p>{subtitle}</p> : subtitle}</div>}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">{children}</div>
        </div>

        {/* Settings Modal */}
        {onTitleChange && (
          <CardSettings
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            title={currentTitle}
            entityId={currentEntityId}
            onSave={handleSaveSettings}
          />
        )}
      </>
    );
  }
);

Card.displayName = "Card";
