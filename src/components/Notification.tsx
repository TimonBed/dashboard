import React, { useEffect } from "react";
import { CheckCircle, X } from "lucide-react";

interface NotificationProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Notification: React.FC<NotificationProps> = ({ message, onClose, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed top-4 right-4 z-[100] animate-slide-in">
      <div className="bg-gradient-to-br from-green-600 to-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px]">
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium">{message}</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
