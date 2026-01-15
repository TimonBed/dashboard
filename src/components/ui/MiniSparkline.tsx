import React, { memo, useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

export interface MiniSparklineProps {
  values: number[];
  className?: string;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  isAnimationActive?: boolean;
  height?: number;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = memo(
  ({
    values,
    className = "h-7 w-full rounded-md bg-white/5 border border-white/10 overflow-hidden",
    stroke = "rgba(59, 130, 246, 0.9)",
    strokeWidth = 0.7,
    fill = "rgba(59, 130, 246, 0.18)",
    isAnimationActive = false,
    height,
  }) => {
    const data = useMemo(() => values.map((v) => ({ v })), [values]);

    if (!values || values.length < 2) {
      return <div className={className} style={height ? { height } : undefined} />;
    }

    return (
      <div className={className} style={height ? { height } : undefined}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <Area
              type="monotone"
              dataKey="v"
              stroke={stroke}
              strokeWidth={strokeWidth}
              fill={fill}
              dot={false}
              isAnimationActive={isAnimationActive}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }
);

MiniSparkline.displayName = "MiniSparkline";
