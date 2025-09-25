import { useState, useEffect } from "react";

/**
 * Shared hook for current time updates to reduce the number of timers
 * All components using this hook will share the same timer
 */
export const useCurrentTime = (updateInterval: number = 1000) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return currentTime;
};
