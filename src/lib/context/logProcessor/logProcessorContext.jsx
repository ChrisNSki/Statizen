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

  // Check if Star Citizen is running
  const checkStarCitizen = useCallback(async () => {
    try {
      const isRunning = await invoke('check_process_running', {
        processName: 'StarCitizen.exe',
      });
      return isRunning;
    } catch (error) {
      console.error('Error checking Star Citizen process:', error);
      return false;
    }
  }, []);

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
      // Start polling every second
      intervalRef.current = setInterval(processLog, 1000);
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
  }, []);

  const stopLogging = useCallback(() => {
    setIsWatching(false);
  }, []);

  const toggleLogging = useCallback(async () => {
    if (isWatching) {
      stopLogging();
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
