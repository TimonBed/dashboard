import React from "react";
import { ExternalLink, Home, Globe, Server, Database, Settings, Monitor } from "lucide-react";
import { Card } from "./Card";
import { MealieIcon } from "../icons/MealieIcon";
import { UniFiIcon } from "../icons/UniFiIcon";
import { CardComponentProps } from "../../types/cardProps";

interface LinkCardSpecificProps {
  title: string;
  url: string;
  icon?: string;
  subtitle?: string;
}

type LinkCardProps = CardComponentProps<LinkCardSpecificProps>;

export const LinkCard: React.FC<LinkCardProps> = ({
  title,
  url,
  icon,
  subtitle,
  onTitleChange,
  onJsonSave,
  onCardDelete,
  cardConfig,
  disabled = false,
  className = "",
}) => {
  const handleClick = () => {
    if (!disabled && url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const getIcon = () => {
    // Check if icon is a URL (http/https or image file extension)
    const isUrl =
      icon &&
      (icon.startsWith("http://") ||
        icon.startsWith("https://") ||
        icon.endsWith(".jpg") ||
        icon.endsWith(".jpeg") ||
        icon.endsWith(".png") ||
        icon.endsWith(".svg") ||
        icon.endsWith(".webp") ||
        icon.endsWith(".gif"));

    if (isUrl) {
      return <img src={icon} alt={title} className="w-5 h-5 object-contain" />;
    }

    const iconMap: Record<string, React.ReactNode> = {
      mealie: <MealieIcon className="w-5 h-5" />,
      home: <Home className="w-5 h-5 text-blue-400" />,
      router: <UniFiIcon className="w-5 h-5" />,
      globe: <Globe className="w-5 h-5 text-green-400" />,
      server: <Server className="w-5 h-5 text-cyan-400" />,
      database: <Database className="w-5 h-5 text-yellow-400" />,
      settings: <Settings className="w-5 h-5 text-gray-400" />,
      monitor: <Monitor className="w-5 h-5 text-indigo-400" />,
    };

    return icon && iconMap[icon] ? iconMap[icon] : <ExternalLink className="w-5 h-5 text-blue-400" />;
  };

  return (
    <Card
      title={title}
      subtitle={subtitle}
      icon={getIcon()}
      onTitleChange={onTitleChange}
      onJsonSave={onJsonSave}
      onCardDelete={onCardDelete}
      cardConfig={cardConfig}
      onClick={handleClick}
      disabled={disabled}
      className={`bg-gradient-to-br from-blue-900/90 to-blue-800/90 hover:from-blue-800/90 hover:to-blue-700/90 transition-all ${className}`}
      width="w-full"
      height="h-full"
    />
  );
};
