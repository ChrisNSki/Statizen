import { createContext, useContext, useState, useEffect } from 'react';
import { loadSettings, saveSettings, calculateXPFromKills } from '@/lib/settings/settingsUtil';

const SettingsContext = createContext();

const consoleDebugging = false;

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to broadcast settings updates to overlay window
  const broadcastSettingsUpdate = (updatedSettings) => {
    try {
      // Use Tauri API to get the overlay window and send it a message
      import('@tauri-apps/api/core').then(({ invoke }) => {
        invoke('broadcast_to_overlay', {
          message: {
            type: 'settings-update',
            settings: updatedSettings,
          },
        }).catch((error) => {
          consoleDebugging && console.log('Could not broadcast settings to overlay:', error.message);
        });
      });
    } catch (error) {
      consoleDebugging && console.log('Could not broadcast settings to overlay:', error.message);
    }
  };

  useEffect(() => {
    loadSettings().then(async (loadedSettings) => {
      setSettings(loadedSettings);
      setLoading(false);

      // Automatically calculate XP from existing kills if needed
      try {
        await calculateXPFromKills();
      } catch (error) {
        consoleDebugging && console.error('Error during automatic XP calculation:', error);
      }
    });
  }, []);

  const updateSettings = async (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveSettings(updated);

    // Broadcast settings update to overlay window
    broadcastSettingsUpdate(updated);
  };

  const updateEventTypes = async (key, value) => {
    const updated = {
      ...settings,
      eventTypes: { ...settings.eventTypes, [key]: value },
    };
    setSettings(updated);
    await saveSettings(updated);

    // Broadcast settings update to overlay window
    broadcastSettingsUpdate(updated);
  };

  const batchUpdateSettings = async (updates) => {
    let updated = { ...settings };

    // Apply all updates to the settings object
    for (const [key, value] of Object.entries(updates)) {
      if (key.startsWith('eventTypes.')) {
        // Handle event types updates
        const eventTypeKey = key.replace('eventTypes.', '');
        updated = {
          ...updated,
          eventTypes: { ...updated.eventTypes, [eventTypeKey]: value },
        };
      } else {
        // Handle regular settings updates
        updated = { ...updated, [key]: value };
      }
    }

    setSettings(updated);
    await saveSettings(updated);

    // Broadcast settings update to overlay window
    broadcastSettingsUpdate(updated);
  };

  const value = {
    settings,
    loading,
    updateSettings,
    updateEventTypes,
    batchUpdateSettings,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
