import React, { useState, forwardRef } from "react";
import { CardSettings } from "./CardSettings";

type CardErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((error: unknown) => React.ReactNode);
};

type CardErrorBoundaryState = {
  hasError: boolean;
  error?: unknown;
};

export class CardErrorBoundary extends React.Component<CardErrorBoundaryProps, CardErrorBoundaryState> {
  state: CardErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: unknown): CardErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown) {
    // Keep this silent in UI; log for debugging.
    console.error("Card render error:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (typeof this.props.fallback === "function") return this.props.fallback(this.state.error);
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex items-center justify-between h-full px-1">
        <div className="flex items-center gap-2">
          <div className="text-red-400 text-sm font-semibold">Render error</div>
          <div className="w-2 h-2 rounded-full bg-red-500 opacity-60"></div>
        </div>
        <div className="text-xs text-gray-400 opacity-80">Right click → JSON</div>
      </div>
    );
  }
}

interface CardProps {
  title: string;
  subtitle?: string | React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
  onTitleChange?: (title: string, entityId?: string) => void;
  onJsonSave?: (config: any) => void;
  onCardDelete?: () => void;
  cardConfig?: any;
  entityId?: string;
  disabled?: boolean;
  className?: string;
  width?: string;
  height?: string;
  padding?: string;
  hideHeader?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      title,
      subtitle,
      icon,
      children,
      onClick,
      onTitleChange,
      onJsonSave,
      onCardDelete,
      cardConfig,
      entityId,
      disabled = false,
      width = "w-80",
      height = "h-16",
      padding = "p-3",
      hideHeader = false,
      onMouseDown,
      onTouchStart,
      className = "",
    },
    ref
  ) => {
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
          className={`bg-[#1D1D1D] backdrop-blur-xl w-full rounded-2xl shadow-2xl transition-all duration-500 group relative overflow-hidden touch-none ${
            onClick ? "cursor-pointer" : ""
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${width} ${height} ${padding} ${className}`}
          onClick={disabled ? undefined : onClick}
          onMouseDown={disabled ? undefined : onMouseDown}
          onTouchStart={disabled ? undefined : onTouchStart}
          onContextMenu={handleRightClick}
        >
          {/* Header */}
          {!hideHeader && (
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
          )}

          {/* Content */}
          <div className="flex-1 h-full">
            <CardErrorBoundary>{children}</CardErrorBoundary>
          </div>
        </div>

        {/* Settings Modal */}
        {onTitleChange && (
          <CardSettings
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            title={currentTitle}
            entityId={currentEntityId}
            cardConfig={cardConfig}
            onSave={handleSaveSettings}
            onSaveJson={onJsonSave}
            onDelete={onCardDelete}
          />
        )}
      </>
    );
  }
);

Card.displayName = "Card";
