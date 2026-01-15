import React, { memo } from "react";

export interface ProgressBarRowProps {
  icon: React.ReactNode;
  value?: number;
  displayValue?: string;
  unit?: string;
  min?: number;
  max: number;
  barColorClassName?: string;
  className?: string;
}

export const ProgressBarRow: React.FC<ProgressBarRowProps> = memo(
  ({ icon, value = 0, displayValue = "--", unit = "", min = 0, max, barColorClassName = "bg-green-500", className = "" }) => {
    const denom = max - min;
    const percentage = denom > 0 ? Math.min(100, Math.max(0, ((value - min) / denom) * 100)) : 0;

    return (
      <div className={`flex items-center gap-1.5 w-full h-4 ${className}`}>
        <div className="text-gray-300 w-3 flex justify-center scale-90">{icon}</div>

        <div className="flex-1 bg-gray-700/30 rounded-full overflow-hidden" style={{ height: "5px" }}>
          <div className={`h-full ${barColorClassName} rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
        </div>

        <div className="text-right min-w-[2.6rem] font-semibold text-white text-[10px] leading-none">
          {displayValue} <span className="text-[9px] text-gray-400">{unit}</span>
        </div>
      </div>
    );
  }
);

ProgressBarRow.displayName = "ProgressBarRow";
