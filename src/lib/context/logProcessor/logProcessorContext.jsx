import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { parseNewLogLines } from '@/lib/log/logUtil';
import { startCleanupInterval, stopCleanupInterval } from '@/lib/nearby/nearbyUtil';
import { invoke } from '@tauri-apps/api/core';
import { loadSettings } from '@/lib/settings/settingsUtil';

const LogProcessorContext = createContext();

export function LogProcessorProvider({ children }) {
  const [isWatching, setIsWatching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const intervalRef = useRef(null);

  const processLog = useCallback(async () => {
    if (isProcessing) return; // Prevent overlapping processing

    setIsProcessing(true);
    try {
      await parseNewLogLines();
    } catch (error) {
      console.error('Error processing log:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  // Start cleanup interval when component mounts
  useEffect(() => {
    // Start cleanup interval for nearby players immediately
    startCleanupInterval();

    // Cleanup on unmount
    return () => {
      stopCleanupInterval();
    };
  }, []);

  useEffect(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isWatching) {
      // Start polling every 2 seconds for better performance
      intervalRef.current = setInterval(processLog, 2000);
    }

    // Cleanup on unmount or when isWatching changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isWatching, processLog]);

  const startLogging = useCallback(async () => {
    setIsWatching(true);

    // Auto-start overlay if enabled in settings
    try {
      const settings = await loadSettings();
      if (settings.showOverlay && settings.targetMonitor) {
        console.log('🎮 Auto-starting overlay for logging session');
        await invoke('position_overlay_window', { monitorId: settings.targetMonitor.id });
        await invoke('show_overlay_window');
      }
    } catch (error) {
      console.error('❌ Failed to auto-start overlay:', error);
    }
  }, []);

  const stopLogging = useCallback(async () => {
    setIsWatching(false);

    // Auto-hide overlay when logging stops
    try {
      await invoke('hide_overlay_window');
      console.log('🎮 Auto-hiding overlay - logging stopped');
    } catch (error) {
      console.error('❌ Failed to hide overlay:', error);
    }
  }, []);

  const toggleLogging = useCallback(async () => {
    if (isWatching) {
      await stopLogging();
    } else {
      await startLogging();
    }
  }, [isWatching, startLogging, stopLogging]);

  const value = {
    isWatching,
    setIsWatching,
    isProcessing,
    setIsProcessing,
    startLogging,
    stopLogging,
    toggleLogging,
  };

  return <LogProcessorContext.Provider value={value}>{children}</LogProcessorContext.Provider>;
}

export function useLogProcessor() {
  const context = useContext(LogProcessorContext);
  if (!context) {
    throw new Error('useLogProcessor must be used within a LogProcessorProvider');
  }
  return context;
}
