/* global __APP_VERSION__ */

const consoleDebugging = false;

export const checkForUpdates = async () => {
  try {
    const response = await fetch('https://api.github.com/repos/ChrisNSki/Statizen/releases/latest');
    const data = await response.json();

    const latestVersion = data.tag_name?.replace('v', '') || '1.0.1';
    const currentVersion = __APP_VERSION__ || '1.0.1';

    const hasUpdate = latestVersion !== currentVersion;

    return {
      hasUpdate,
      currentVersion,
      latestVersion,
      updateUrl: data.html_url || 'https://github.com/ChrisNSki/Statizen/releases/latest',
    };
  } catch (error) {
    consoleDebugging && console.error('Version check failed:', error.message);
    return {
      hasUpdate: false,
      currentVersion: __APP_VERSION__ || '1.0.1',
      latestVersion: null,
    };
  }
};
