import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { parseNewLogLines } from '@/lib/log/logUtil';

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
