/* global __APP_VERSION__ */
import { useState, useEffect } from 'react';
import { checkForUpdates } from '@/lib/utils/versionCheck';

export const useVersionCheck = () => {
  const [updateInfo, setUpdateInfo] = useState({
    hasUpdate: false,
    currentVersion: __APP_VERSION__ || '1.0.1',
    latestVersion: null,
    loading: false,
  });

  useEffect(() => {
    const checkUpdates = async () => {
      try {
        setUpdateInfo((prev) => ({ ...prev, loading: true }));
        const result = await checkForUpdates();
        setUpdateInfo({
          ...result,
          loading: false,
        });
      } catch (error) {
        setUpdateInfo({
          hasUpdate: false,
          currentVersion: __APP_VERSION__ || '1.0.1',
          latestVersion: null,
          loading: false,
        });
      }
    };

    // Check for updates after a short delay
    const timer = setTimeout(checkUpdates, 2000);
    return () => clearTimeout(timer);
  }, []);

  return updateInfo;
};
