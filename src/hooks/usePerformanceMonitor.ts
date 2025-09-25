import { useEffect, useRef } from "react";

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  componentName: string;
  timestamp: number;
}

interface PerformanceMonitorOptions {
  enabled?: boolean;
  logToConsole?: boolean;
  maxMetrics?: number;
  componentName: string;
}

/**
 * Hook to monitor component performance
 */
export const usePerformanceMonitor = (options: PerformanceMonitorOptions) => {
  const { enabled = true, logToConsole = false, maxMetrics = 100, componentName } = options;
  const metricsRef = useRef<PerformanceMetrics[]>([]);
  const renderStartRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    // Start measuring render time
    renderStartRef.current = performance.now();

    return () => {
      // Measure render time on cleanup
      const renderTime = performance.now() - renderStartRef.current;

      const metric: PerformanceMetrics = {
        renderTime,
        memoryUsage: (performance as any).memory?.usedJSHeapSize,
        componentName,
        timestamp: Date.now(),
      };

      metricsRef.current.push(metric);

      // Keep only the latest metrics
      if (metricsRef.current.length > maxMetrics) {
        metricsRef.current = metricsRef.current.slice(-maxMetrics);
      }

      if (logToConsole) {
        console.log(`[Performance] ${componentName}:`, {
          renderTime: `${renderTime.toFixed(2)}ms`,
          memoryUsage: metric.memoryUsage ? `${(metric.memoryUsage / 1024 / 1024).toFixed(2)}MB` : "N/A",
        });
      }
    };
  });

  const getMetrics = () => metricsRef.current;

  const getAverageRenderTime = () => {
    if (metricsRef.current.length === 0) return 0;
    const total = metricsRef.current.reduce((sum, metric) => sum + metric.renderTime, 0);
    return total / metricsRef.current.length;
  };

  const getSlowRenders = (threshold: number = 16) => {
    return metricsRef.current.filter((metric) => metric.renderTime > threshold);
  };

  const clearMetrics = () => {
    metricsRef.current = [];
  };

  return {
    getMetrics,
    getAverageRenderTime,
    getSlowRenders,
    clearMetrics,
  };
};

/**
 * Hook to monitor WebSocket performance
 */
export const useWebSocketPerformanceMonitor = () => {
  const messageCountRef = useRef(0);
  const lastMessageTimeRef = useRef<number>(0);
  const messageTimesRef = useRef<number[]>([]);

  const recordMessage = () => {
    const now = performance.now();
    messageCountRef.current++;

    if (lastMessageTimeRef.current > 0) {
      const timeSinceLastMessage = now - lastMessageTimeRef.current;
      messageTimesRef.current.push(timeSinceLastMessage);

      // Keep only last 100 message intervals
      if (messageTimesRef.current.length > 100) {
        messageTimesRef.current = messageTimesRef.current.slice(-100);
      }
    }

    lastMessageTimeRef.current = now;
  };

  const getMessageRate = () => {
    if (messageTimesRef.current.length === 0) return 0;
    const averageInterval = messageTimesRef.current.reduce((sum, time) => sum + time, 0) / messageTimesRef.current.length;
    return 1000 / averageInterval; // messages per second
  };

  const getTotalMessages = () => messageCountRef.current;

  const reset = () => {
    messageCountRef.current = 0;
    lastMessageTimeRef.current = 0;
    messageTimesRef.current = [];
  };

  return {
    recordMessage,
    getMessageRate,
    getTotalMessages,
    reset,
  };
};
