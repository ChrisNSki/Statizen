import { invoke } from '@tauri-apps/api/core';

/** @typedef {{id:number,name?:string,friendly?:string,x:number,y:number,width:number,height:number,scale:number,primary:boolean,key:string}} MonitorInfo */

/**
 * Get list of available monitors from Rust backend
 * @returns {Promise<MonitorInfo[]>}
 */
export async function getMonitors() {
  try {
    /** @type {MonitorInfo[]} */
    const monitors = await invoke('list_monitors');
    console.log('🖥️ Detected monitors:', monitors);
    return monitors;
  } catch (err) {
    console.error('monitor list failed', err);
    return [];
  }
}

/**
 * Find monitor by ID
 * @param {MonitorInfo[]} monitors - Array of monitor objects
 * @param {number} id - Monitor ID to find
 * @returns {MonitorInfo|null} Monitor object or null if not found
 */
export function findMonitorById(monitors, id) {
  return monitors.find((m) => m.id === id) || null;
}

/**
 * Get monitor display name for UI
 * @param {MonitorInfo} m - Monitor object
 * @returns {string} Display name
 */
export function getMonitorDisplayName(m) {
  if (!m) return 'Unknown Monitor';

  let base;
  if (m.friendly?.trim()) {
    // Use friendly name if available
    base = m.friendly;
  } else if (m.name) {
    // Clean up device path by removing \\.\ prefix
    base = m.name.replace(/^\\\\\.\\/, '');
  } else {
    // Fallback to generic name
    base = `Monitor ${m.id + 1}`;
  }

  return `${m.primary ? '[Primary] ' : ''}${base} (${m.width}x${m.height} @${m.scale.toFixed(2)})`;
}

/**
 * Bind a window to a monitor (full-screen, click-through optional)
 * @param {string} label - Window label
 * @param {number} monitorIdx - Monitor index to bind to
 * @param {boolean} captureInput - Whether to capture input (default: false)
 * @returns {Promise<void>}
 */
export async function bindWindowToMonitor(label, monitorIdx, captureInput = false) {
  await invoke('bind_window_to_monitor', { label, monitorIdx, captureInput });
}

// Debounce map for window binding operations
const debounceMap = new Map();

/**
 * Debounced window binding to prevent excessive calls
 * @param {string} label - Window label
 * @param {number} monitorIdx - Monitor index to bind to
 * @param {boolean} captureInput - Whether to capture input (default: false)
 * @param {number} delay - Debounce delay in ms (default: 300)
 * @returns {Promise<void>}
 */
export function debouncedBindWindowToMonitor(label, monitorIdx, captureInput = false, delay = 300) {
  const key = `${label}_${monitorIdx}_${captureInput}`;

  // Clear existing timeout
  if (debounceMap.has(key)) {
    clearTimeout(debounceMap.get(key));
  }

  // Set new timeout
  const timeoutId = setTimeout(async () => {
    try {
      await bindWindowToMonitor(label, monitorIdx, captureInput);
    } catch (error) {
      console.error('❌ Failed to bind window to monitor:', error);
    } finally {
      debounceMap.delete(key);
    }
  }, delay);

  debounceMap.set(key, timeoutId);
}

/**
 * Validate and get fallback monitor if the saved monitor is no longer available
 * @param {MonitorInfo[]} current - Currently available monitors
 * @param {MonitorInfo|null} saved - Previously saved monitor
 * @returns {MonitorInfo|null} Valid monitor or fallback to primary
 */
export function validateMonitorWithFallback(current, saved) {
  if (!current?.length) return null;
  if (!saved) return current.find((m) => m.primary) || current[0];

  // Prefer id match, fall back to key match
  const byId = current.find((m) => m.id === saved.id);
  if (byId) return byId;
  if (saved.key) {
    const byKey = current.find((m) => m.key === saved.key);
    if (byKey) return byKey;
  }
  return current.find((m) => m.primary) || current[0];
}

/**
 * Hot-plug monitor detection with fallback handling
 * @param {MonitorInfo|null} savedMonitor - Previously saved monitor
 * @returns {Promise<{monitors: MonitorInfo[], selectedMonitor: MonitorInfo|null, needsUpdate: boolean}>}
 */
export async function getMonitorsWithFallback(savedMonitor) {
  const monitors = await getMonitors();
  const selectedMonitor = validateMonitorWithFallback(monitors, savedMonitor);
  const needsUpdate = savedMonitor && !findMonitorById(monitors, savedMonitor.id);

  return {
    monitors,
    selectedMonitor,
    needsUpdate,
  };
}
