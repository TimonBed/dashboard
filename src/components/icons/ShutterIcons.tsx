import React from "react";

interface ShutterIconProps {
  className?: string;
  size?: number;
}

export const ShutterClosed: React.FC<ShutterIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Window frame */}
    <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />

    {/* Closed shutter slats - horizontal lines */}
    <line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="1.2" />
    <line x1="4" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="1.2" />
    <line x1="4" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="1.2" />
    <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.2" />
    <line x1="4" y1="14" x2="20" y2="14" stroke="currentColor" strokeWidth="1.2" />
    <line x1="4" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth="1.2" />
    <line x1="4" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="1.2" />

    {/* Shutter mechanism */}
    <circle cx="19" cy="6" r="1" fill="currentColor" />
    <circle cx="19" cy="18" r="1" fill="currentColor" />
  </svg>
);

export const ShutterHalfOpen: React.FC<ShutterIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Window frame */}
    <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />

    {/* Half-open shutter slats - partially visible */}
    <line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
    <line x1="4" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
    <line x1="4" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
    <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.2" opacity="0.9" />
    <line x1="4" y1="14" x2="20" y2="14" stroke="currentColor" strokeWidth="1.2" />
    <line x1="4" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth="1.2" />
    <line x1="4" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="1.2" />

    {/* Light rays */}
    <path d="M4 6 L8 4 L8 8 L4 6 Z" fill="currentColor" opacity="0.2" />
    <path d="M4 8 L10 5 L10 9 L4 8 Z" fill="currentColor" opacity="0.15" />
    <path d="M4 10 L12 6 L12 10 L4 10 Z" fill="currentColor" opacity="0.1" />

    {/* Shutter mechanism */}
    <circle cx="19" cy="6" r="1" fill="currentColor" />
    <circle cx="19" cy="18" r="1" fill="currentColor" />
  </svg>
);

export const ShutterOpen: React.FC<ShutterIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Window frame */}
    <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />

    {/* Open window - no shutter slats visible, just light */}
    <rect x="4" y="6" width="16" height="12" fill="currentColor" opacity="0.1" />

    {/* Light rays coming through */}
    <path d="M4 6 L6 4 L6 8 L4 6 Z" fill="currentColor" opacity="0.3" />
    <path d="M4 8 L8 5 L8 11 L4 8 Z" fill="currentColor" opacity="0.25" />
    <path d="M4 10 L10 6 L10 12 L4 10 Z" fill="currentColor" opacity="0.2" />
    <path d="M4 12 L12 7 L12 13 L4 12 Z" fill="currentColor" opacity="0.15" />
    <path d="M4 14 L14 8 L14 14 L4 14 Z" fill="currentColor" opacity="0.1" />
    <path d="M4 16 L16 9 L16 15 L4 16 Z" fill="currentColor" opacity="0.05" />

    {/* Shutter mechanism */}
    <circle cx="19" cy="6" r="1" fill="currentColor" />
    <circle cx="19" cy="18" r="1" fill="currentColor" />
  </svg>
);
