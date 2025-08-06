import { configDir, join } from '@tauri-apps/api/path';
import { exists, mkdir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { loadSettings } from '@/lib/settings/settingsUtil';
import { resetUserShip } from '@/lib/user/userUtil';
import { engineRunner } from '@/processing_engine/engine';
import { processNameAndID } from '@/lib/initialization/processNameandID';

async function getLogPath() {
  const settings = await loadSettings();
  const logPath = settings.logPath;
  return logPath;
}

const defaultLogInfo = {
  logDate: '',
  logFileSize: 0,
  lastProcessedLine: 0,
  lastFileModified: 0,
  gameDetected: false,
};

export async function getLogInfoPath() {
  const dir = await configDir();
  const settingsDir = await join(dir, 'statizen');
  if (!(await exists(settingsDir))) await mkdir(settingsDir, { recursive: true });
  return await join(settingsDir, 'logInfo.json');
}

export async function loadLogInfo() {
  const path = await getLogInfoPath();
  try {
    const text = await readTextFile(path);
    return JSON.parse(text);
  } catch {
    return { ...defaultLogInfo };
  }
}

export async function saveLogInfo(data) {
  const path = await getLogInfoPath();
  await writeTextFile(path, JSON.stringify(data, null, 2));
}

export async function getFileSize(filePath) {
  try {
    const stats = await import('@tauri-apps/plugin-fs').then((fs) => fs.stat(filePath));
    return stats.size;
  } catch {
    return 0;
  }
}

export async function getFileModifiedTime(filePath) {
  try {
    const stats = await import('@tauri-apps/plugin-fs').then((fs) => fs.stat(filePath));
    return stats.mtime;
  } catch {
    return 0;
  }
}

// New function to detect if Star Citizen is running based on log file activity
export async function detectGameRunning() {
  const logPath = await getLogPath();

  try {
    if (!(await exists(logPath))) {
      return false;
    }

    const currentSize = await getFileSize(logPath);
    const currentModified = await getFileModifiedTime(logPath);
    const storedLogInfo = await loadLogInfo();

    // Check if file has been modified recently (within last 30 seconds)
    const thirtySecondsAgo = Date.now() - 30000;
    const isRecentlyModified = currentModified > thirtySecondsAgo;

    // Check if file size is growing (indicating active logging)
    const isGrowing = currentSize > storedLogInfo.logFileSize;

    // Game is running if file is being actively written to
    const gameRunning = isRecentlyModified && isGrowing;

    // Update stored info
    const updatedLogInfo = {
      ...storedLogInfo,
      logFileSize: currentSize,
      lastFileModified: currentModified,
      gameDetected: gameRunning,
    };
    await saveLogInfo(updatedLogInfo);

    return gameRunning;
  } catch (error) {
    console.error('Error detecting game running:', error);
    return false;
  }
}

export async function parseNewLogLines() {
  console.log('🔄 parseNewLogLines called');
  const logPath = await getLogPath();

  try {
    // Get current log file info
    const currentSize = await getFileSize(logPath);
    console.log('📊 Current log file size:', currentSize);

    // Load stored log info
    const storedLogInfo = await loadLogInfo();

    // Check if we need to process this log file
    if (currentSize === 0) {
      return;
    }

    // If file size has changed, process new lines
    if (storedLogInfo.logFileSize !== currentSize) {
      // Read the entire log file
      const logContent = await readTextFile(logPath);
      const lines = logContent.split('\n');

      if (lines[1] !== storedLogInfo.logDate || !lines[1]) {
        console.log('log date has changed');
        const updatedLogInfo = {
          logDate: lines[1],
          logFileSize: currentSize,
          lastProcessedLine: 0,
          lastFileModified: await getFileModifiedTime(logPath),
          gameDetected: true,
        };

        await saveLogInfo(updatedLogInfo);
        await resetUserShip();
        return;
      }
      // Process lines one by one, updating position after each line
      let currentLine = storedLogInfo.lastProcessedLine;

      for (let i = currentLine; i < lines.length; i++) {
        const rawLine = lines[i];
        const line = await rawLine.trim();

        if (line) {
          await processLogLine(line);
          // Only increment and save progress if we processed meaningful content
          currentLine = i + 1;
          const updatedLogInfo = {
            logDate: storedLogInfo.logDate,
            logFileSize: currentSize,
            lastProcessedLine: currentLine,
            lastFileModified: await getFileModifiedTime(logPath),
            gameDetected: true,
          };
          await saveLogInfo(updatedLogInfo);
        }
        // Don't increment currentLine for blank lines
      }
    }
  } catch (error) {
    console.error('Error processing log lines:', error);
  }
}

async function processLogLine(_line) {
  console.log('🔍 Processing log line:', _line);

  if (_line.includes('<Actor Death>')) {
    console.log('✅ Actor Death detected, calling engineRunner');
    await engineRunner(_line, 'actorDeath');
  } else if (_line.includes('<FatalCollision>')) {
    console.log('💥 Fatal Collision detected, calling engineRunner');
    await engineRunner(_line, 'crashEvent');
  } else if (_line.includes('<Vehicle Destruction>')) {
    console.log('💥 Vehicle Destruction detected, calling engineRunner');
    await engineRunner(_line, 'crashEvent');
  } else if (_line.includes('<AccountLoginCharacterStatus_Character>')) {
    console.log('✅ AccountLoginCharacterStatus_Character detected, processing directly');
    await processNameAndID(_line);
  } else if (_line.includes('<Spawn Flow>')) {
    await engineRunner(_line, 'spawnFlow');
  } else if (_line.includes('<Actor Stall>')) {
    await engineRunner(_line, 'stallFlow');
  } else if (_line.includes('<RequestLocationInventory>')) {
    await engineRunner(_line, 'requestLocationInventory');
  } else if (_line.includes('<Vehicle Control Flow>')) {
    await engineRunner(_line, 'vehicleControlFlow');
  } else if (_line.includes('<[ActorState] Corpse>')) {
    await engineRunner(_line, 'corpse');
  } else if (_line.includes('<EndMission>')) {
    await engineRunner(_line, 'endMission');
  }
}
