import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "red" | "orange" | "yellow" | "green" | "gray" | "blue";
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = "default", className = "" }) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "red":
        return "text-red-400";
      case "orange":
        return "text-orange-400";
      case "yellow":
        return "text-yellow-400";
      case "green":
        return "text-green-400";
      case "gray":
        return "text-gray-400";
      case "blue":
        return "text-blue-400";
      default:
        return "text-white";
    }
  };

  return (
    <div
      className={`px-3 py-1 rounded-full font-semibold border border-white/10 backdrop-blur-sm bg-black/20 transition-colors duration-300 ${getVariantClasses()} ${className}`}
    >
      {children}
    </div>
  );
};

export default Badge;
