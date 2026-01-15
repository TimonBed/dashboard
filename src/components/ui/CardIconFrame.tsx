import React from "react";

export interface CardIconFrameProps {
  children: React.ReactNode;
  className?: string;
  iconClassName?: string;
}

export const CardIconFrame: React.FC<CardIconFrameProps> = ({ children, className = "", iconClassName = "" }) => {
  return (
    <div className={`p-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 ${className}`}>
      <div className={`w-5 h-5 flex items-center justify-center ${iconClassName}`}>{children}</div>
    </div>
  );
};

