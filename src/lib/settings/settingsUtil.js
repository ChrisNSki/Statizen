import { configDir, join } from '@tauri-apps/api/path';
import { exists, mkdir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';

const defaultSettings = {
  version: '0.1.0',
  logPath: '',
  notifications: false,
  webhookType: '',
  webhookUrl: '',
  webhookEnabled: false,
  discordEnabled: false,
  discordWebhookUrl: '',
  eventTypes: {
    pvpKills: true,
    pvpDeaths: true,
    pveKills: false,
    suicides: false,
    levelUps: true,
  },
  allowDictionarySubmit: false,
  showOverlay: false, // 👈 Toggle for showing overlay
  overlayColor: '#4A8FD460', // 60% opacity
  targetMonitor: null, // 👈 Monitor object: { id: number, name: string }
  faction: 'peacekeeper',
  rpgEnabled: false,
  discordLevelData: false,
  minimizeOnLaunch: false,
  overlayWidgets: [
    { id: 'status', component: 'StatusOverlay', x: 20, y: 20, w: 240, h: 180 },
    { id: 'pvp-kd', component: 'PVPKDRatioOverlay', x: 280, y: 20, w: 240, h: 180 },
    { id: 'pve-kd', component: 'PVEKDRatioOverlay', x: 540, y: 20, w: 240, h: 180 },
    { id: 'log-lines', component: 'LogLinesProcessedOverlay', x: 800, y: 20, w: 180, h: 180 },
    { id: 'nearby', component: 'NearbyPlayersOverlay', x: 20, y: 220, w: 240, h: 180 },
    { id: 'last-killed-by', component: 'LastKilledByOverlay', x: 280, y: 220, w: 240, h: 180 },
    { id: 'last-killed', component: 'LastKilledOverlay', x: 540, y: 220, w: 240, h: 180 },
    { id: 'xp-bar', component: 'XPBarOverlay', x: 800, y: 220, w: 180, h: 180 },
  ],
  widgetVisibility: {
    status: true,
    'pvp-kd': true,
    'pve-kd': true,
    'log-lines': true,
    nearby: true,
    'last-killed-by': true,
    'last-killed': true,
    'xp-bar': true,
  },
};

export async function getSettingsPath() {
  const dir = await configDir();
  const settingsDir = await join(dir, 'statizen');
  if (!(await exists(settingsDir))) await mkdir(settingsDir, { recursive: true });
  return await join(settingsDir, 'settings.json');
}

export async function loadSettings() {
  const path = await getSettingsPath();
  try {
    const text = await readTextFile(path);
    const storedSettings = JSON.parse(text);

    return { ...defaultSettings, ...storedSettings };
  } catch {
    return { ...defaultSettings };
  }
}

export async function saveSettings(data) {
  const path = await getSettingsPath();
  await writeTextFile(path, JSON.stringify(data, null, 2));
}

// Calculate XP from existing kill data for users who have kills but no XP
export async function calculateXPFromKills() {
  try {
    const { loadPVE, savePVE } = await import('../pve/pveUtil.js');
    const pvpUtil = await import('../pvp/pvpUtil.js');

    const pveData = await loadPVE();
    const pvpData = await pvpUtil.loadPVP();

    let hasChanges = false;

    // Calculate PVE XP if not present or 0, and has kills
    if (pveData && pveData.kills > 0 && (!pveData.xp || pveData.xp === 0)) {
      const pveXP = pveData.kills * 10; // 10 XP per PVE kill
      pveData.xp = pveXP;
      await savePVE(pveData);
      hasChanges = true;
    }

    // Calculate PVP XP if not present or 0, and has kills
    if (pvpData && pvpData.kills > 0 && (!pvpData.xp || pvpData.xp === 0)) {
      const pvpXP = pvpData.kills * 20; // 20 XP per PVP kill
      pvpData.xp = pvpXP;
      await pvpUtil.savePVP(pvpData);
      hasChanges = true;
    }

    if (hasChanges) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('❌ Error calculating XP from kills:', error);
    return false;
  }
}
