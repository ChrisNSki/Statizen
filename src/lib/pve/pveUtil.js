import { configDir, join } from '@tauri-apps/api/path';
import { exists, mkdir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';

const currentMonth = new Date().toISOString().slice(0, 7);
const previousMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);

const defaultPVEStats = {
  kills: 0,
  deaths: 0,
  xp: 0,
  currentMonth: {
    month: currentMonth,
    kills: 0,
    deaths: 0,
  },
  previousMonth: {
    month: previousMonth,
    kills: 0,
    deaths: 0,
  },
};

export async function getPVEPath() {
  const dir = await configDir();
  const pveDir = await join(dir, 'statizen', 'pve');
  if (!(await exists(pveDir))) await mkdir(pveDir, { recursive: true });
  return await join(pveDir, 'pve.json');
}

export async function getPVELogPath() {
  const dir = await configDir();
  const pveDir = await join(dir, 'statizen', 'pve');
  if (!(await exists(pveDir))) await mkdir(pveDir, { recursive: true });
  return await join(pveDir, 'pve-log.json');
}

export async function loadPVE() {
  const path = await getPVEPath();
  try {
    const text = await readTextFile(path);
    return JSON.parse(text);
  } catch {
    return { ...defaultPVEStats };
  }
}

export async function loadPVELog() {
  const path = await getPVELogPath();
  try {
    const text = await readTextFile(path);
    return JSON.parse(text);
  } catch {
    return [];
  }
}

// Internal function to write PVE data without triggering month change check
async function writePVEData(data) {
  const path = await getPVEPath();
  await writeTextFile(path, JSON.stringify(data, null, 2));
}

export async function savePVE(data) {
  await checkMonthChange();
  await writePVEData(data);
}

export async function addPVELogEntry(npcClass, action, weaponClass = null) {
  const dateTime = new Date().toISOString();
  const logEntry = {
    action: action,
    npcClass: npcClass,
    dateTime: dateTime,
  };

  if (weaponClass !== null) {
    logEntry.weaponClass = weaponClass;
  }

  const path = await getPVELogPath();
  const log = await loadPVELog();
  log.push(logEntry);
  await writeTextFile(path, JSON.stringify(log, null, 2));
}

export async function checkMonthChange() {
  const pve = await loadPVE();
  const currentMonth = new Date().toISOString().slice(0, 7);
  if (pve.currentMonth.month !== currentMonth) {
    pve.previousMonth = pve.currentMonth;
    pve.currentMonth = {
      month: currentMonth,
      kills: 0,
      deaths: 0,
    };
    // Preserve XP across months
    if (!pve.xp) pve.xp = 0;
    await writePVEData(pve); // 🎯 FIX: Use internal function to avoid recursion
  }
}
