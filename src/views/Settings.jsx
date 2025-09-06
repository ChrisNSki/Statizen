import React, { useState, useEffect } from 'react';
import { useSettings } from '@/lib/context/settings/settingsContext';

// Import settings components
import GeneralSettings from '@/components/settings/GeneralSettings';
import OverlaySettings from '@/components/settings/OverlaySettings';
import LevelProgressionSettings from '@/components/settings/LevelProgressionSettings';
import DiscordSettings from '@/components/settings/DiscordSettings';
import AboutSettings from '@/components/settings/AboutSettings';
import SettingsMenu from '@/components/settings/SettingsMenu';

const consoleDebugging = false;

function Settings() {
  const { settings, loading, updateSettings, updateEventTypes, batchUpdateSettings } = useSettings();
  const [activeSection, setActiveSection] = useState('general');

  // Debug: Monitor settings changes
  useEffect(() => {
    consoleDebugging &&
      console.log('Settings changed in UI:', {
        rpgEnabled: settings?.rpgEnabled,
        discordLevelData: settings?.discordLevelData,
        levelUps: settings?.eventTypes?.levelUps,
      });
  }, [settings?.rpgEnabled, settings?.discordLevelData, settings?.eventTypes?.levelUps]);

  if (loading || !settings) return <div>Loading Settings...</div>;

  const renderActiveComponent = () => {
    switch (activeSection) {
      case 'general':
        return <GeneralSettings settings={settings} updateSettings={updateSettings} />;
      case 'overlay':
        return <OverlaySettings settings={settings} updateSettings={updateSettings} />;
      case 'level-progression':
        return <LevelProgressionSettings settings={settings} updateSettings={updateSettings} batchUpdateSettings={batchUpdateSettings} />;
      case 'discord':
        return <DiscordSettings settings={settings} updateSettings={updateSettings} updateEventTypes={updateEventTypes} />;
      case 'about':
        return <AboutSettings />;
      default:
        return <GeneralSettings settings={settings} updateSettings={updateSettings} />;
    }
  };

  return (
    <div className='flex h-full'>
      {/* Left Sidebar Navigation */}
      <SettingsMenu activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main Content Area */}
      <div className='flex-1 overflow-auto p-6'>{renderActiveComponent()}</div>
    </div>
  );
}

export default Settings;
