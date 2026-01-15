import React, { memo } from "react";
import { Battery } from "lucide-react";
import Badge from "./Badge";

export interface BatteryBadgeProps {
  level?: number | null;
  className?: string;
}

const getBatteryColor = (level: number) => {
  if (level <= 20) return "red";
  if (level <= 50) return "yellow";
  return "green";
};

export const BatteryBadge: React.FC<BatteryBadgeProps> = memo(({ level, className = "" }) => {
  if (level === null || level === undefined || Number.isNaN(level)) return null;
  const displayLevel = Math.max(0, Math.min(100, Math.round(level)));
  return (
    <Badge variant={getBatteryColor(displayLevel) as any} className={`flex items-center gap-1 px-1.5 py-[2px] h-5 leading-none ${className}`}>
      <span className="text-[10px] font-semibold leading-none">{displayLevel}%</span>
      <Battery className="w-3 h-3" />
    </Badge>
  );
});

BatteryBadge.displayName = "BatteryBadge";
