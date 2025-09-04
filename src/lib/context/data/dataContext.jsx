import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { loadUser, saveUser } from '@/lib/user/userUtil';
import { loadLogInfo } from '@/lib/log/logUtil';
import { loadPVE, savePVE, loadPVELog } from '@/lib/pve/pveUtil';
import { loadPVP, savePVP, loadPVPLog } from '@/lib/pvp/pvpUtil';
import { loadNearby } from '@/lib/nearby/nearbyUtil';
import NPCDictionary from '@/assets/NPC-Dictionary.json';

// Optimized deep comparison function
const deepEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== typeof obj2) return false;

  if (typeof obj1 !== 'object') return obj1 === obj2;

  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

  if (Array.isArray(obj1)) {
    if (obj1.length !== obj2.length) return false;
    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqual(obj1[i], obj2[i])) return false;
    }
    return true;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (let key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
};

const DataContext = createContext();

// Helper function to get NPC name from dictionary
const getNPCName = (npcClass) => {
  if (!npcClass) return null;

  // Check if it's in the dictionary
  if (NPCDictionary.dictionary[npcClass]) {
    return NPCDictionary.dictionary[npcClass].name;
  }

  // If not found, return the original class name
  return npcClass;
};

export function DataProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [logInfo, setLogInfo] = useState(null);
  const [PVEData, setPVEData] = useState(null);
  const [PVPData, setPVPData] = useState(null);
  const [lastKilledBy, setLastKilledBy] = useState(null);
  const [lastKilledActor, setLastKilledActor] = useState(null);
  const [nearbyPlayers, setNearbyPlayers] = useState([]);
  const [pveLog, setPveLog] = useState([]);
  const [pvpLog, setPvpLog] = useState([]);

  // Separate tracking for each data type
  const lastUserContent = useRef(null);
  const lastLogInfoContent = useRef(null);
  const lastPVEContent = useRef(null);
  const lastPVPContent = useRef(null);
  const lastLastKilledByContent = useRef(null);
  const lastLastKilledActorContent = useRef(null);
  const lastNearbyContent = useRef(null);
  const lastPveLogContent = useRef(null);
  const lastPvpLogContent = useRef(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const userData = await loadUser();
        const logInfoData = await loadLogInfo();
        const PVEData = await loadPVE();
        const PVPData = await loadPVP();
        const lastKilledBy = await getLastKilledBy();
        const lastKilledActor = await getLastKilledActor();
        const nearbyData = await loadNearby();
        const pveLogData = await loadPVELog();
        const pvpLogData = await loadPVPLog();

        setUserData(userData);
        setLogInfo(logInfoData);
        setPVEData(PVEData);
        setPVPData(PVPData);
        setLastKilledBy(lastKilledBy);
        setLastKilledActor(lastKilledActor);
        setNearbyPlayers(nearbyData);
        setPveLog(pveLogData);
        setPvpLog(pvpLogData);

        lastUserContent.current = JSON.stringify(userData);
        lastLogInfoContent.current = JSON.stringify(logInfoData);
        lastPVEContent.current = JSON.stringify(PVEData);
        lastPVPContent.current = JSON.stringify(PVPData);
        lastLastKilledByContent.current = JSON.stringify(lastKilledBy);
        lastLastKilledActorContent.current = JSON.stringify(lastKilledActor);
        lastNearbyContent.current = JSON.stringify(nearbyData);
        lastPveLogContent.current = JSON.stringify(pveLogData);
        lastPvpLogContent.current = JSON.stringify(pvpLogData);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  // Poll for file changes with optimized performance
  useEffect(() => {
    let isPolling = false;

    const pollData = async () => {
      if (isPolling) return; // Prevent overlapping polls
      isPolling = true;

      try {
        const currentUserData = await loadUser();
        const currentLogInfoData = await loadLogInfo();
        const currentPVEData = await loadPVE();
        const currentPVPData = await loadPVP();
        const currentLastKilledBy = await getLastKilledBy();
        const currentLastKilledActor = await getLastKilledActor();
        const currentNearbyData = await loadNearby();
        const currentPveLogData = await loadPVELog();
        const currentPvpLogData = await loadPVPLog();

        // Use deep comparison instead of JSON.stringify for better performance
        const hasUserChanged = !deepEqual(currentUserData, userData);
        const hasLogInfoChanged = !deepEqual(currentLogInfoData, logInfo);
        const hasPVEChanged = !deepEqual(currentPVEData, PVEData);
        const hasPVPChanged = !deepEqual(currentPVPData, PVPData);
        const hasLastKilledByChanged = !deepEqual(currentLastKilledBy, lastKilledBy);
        const hasLastKilledActorChanged = !deepEqual(currentLastKilledActor, lastKilledActor);
        const hasNearbyChanged = !deepEqual(currentNearbyData, nearbyPlayers);
        const hasPveLogChanged = !deepEqual(currentPveLogData, pveLog);
        const hasPvpLogChanged = !deepEqual(currentPvpLogData, pvpLog);

        // Only update state if data has actually changed
        if (hasUserChanged) {
          setUserData(currentUserData);
        }

        if (hasLogInfoChanged) {
          setLogInfo(currentLogInfoData);
        }

        if (hasPVEChanged) {
          setPVEData(currentPVEData);
        }

        if (hasPVPChanged) {
          setPVPData(currentPVPData);
        }

        if (hasLastKilledByChanged) {
          setLastKilledBy(currentLastKilledBy);
        }

        if (hasLastKilledActorChanged) {
          setLastKilledActor(currentLastKilledActor);
        }

        if (hasNearbyChanged) {
          setNearbyPlayers(currentNearbyData);
        }

        if (hasPveLogChanged) {
          setPveLog(currentPveLogData);
        }

        if (hasPvpLogChanged) {
          setPvpLog(currentPvpLogData);
        }
      } catch (error) {
        console.error('Failed to poll data:', error);
      } finally {
        isPolling = false;
      }
    };

    const pollInterval = setInterval(pollData, 2000); // Reduced to 2 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [userData, logInfo, PVEData, PVPData, lastKilledBy, lastKilledActor, nearbyPlayers, pveLog, pvpLog]);

  const updateUserData = async (key, value) => {
    const updated = { ...userData, [key]: value };
    setUserData(updated);
    await saveUser(updated);
  };

  const updatePVEData = async (key, value) => {
    const updated = { ...PVEData, [key]: value };
    setPVEData(updated);
    await savePVE(updated);
  };

  const updatePVPData = async (key, value) => {
    const updated = { ...PVPData, [key]: value };
    setPVPData(updated);
    await savePVP(updated);
  };

  const getLastKilledBy = async () => {
    let lastKilledBy = {
      actorName: null,
      time: null,
    };
    const pveLog = await loadPVELog();
    const pvpLog = await loadPVPLog();

    // Filter for loss actions only
    const pveLosses = pveLog.filter((entry) => entry.action === 'loss');
    const pvpLosses = pvpLog.filter((entry) => entry.action === 'loss');

    const lastPVELoss = pveLosses[pveLosses.length - 1];
    const lastPVPLoss = pvpLosses[pvpLosses.length - 1];

    if (lastPVELoss && lastPVPLoss) {
      const mostRecentLoss = lastPVELoss.dateTime > lastPVPLoss.dateTime ? lastPVELoss : lastPVPLoss;
      // Use NPC lookup for PVE, direct name for PVP
      lastKilledBy.actorName = mostRecentLoss.npcClass ? getNPCName(mostRecentLoss.npcClass) : mostRecentLoss.playerClass;
      lastKilledBy.time = mostRecentLoss.dateTime;
    } else if (lastPVELoss) {
      lastKilledBy.actorName = getNPCName(lastPVELoss.npcClass);
      lastKilledBy.time = lastPVELoss.dateTime;
    } else if (lastPVPLoss) {
      lastKilledBy.actorName = lastPVPLoss.playerClass;
      lastKilledBy.time = lastPVPLoss.dateTime;
    } else {
      lastKilledBy.actorName = 'No one yet!';
      lastKilledBy.time = null;
    }
    return lastKilledBy;
  };

  const getLastKilledActor = async () => {
    let lastKilledActor = {
      actorName: null,
      time: null,
    };
    const pveLog = await loadPVELog();
    const pvpLog = await loadPVPLog();

    // Filter for win actions only
    const pveWins = pveLog.filter((entry) => entry.action === 'win');
    const pvpWins = pvpLog.filter((entry) => entry.action === 'win');

    const lastPVEWin = pveWins[pveWins.length - 1];
    const lastPVPWin = pvpWins[pvpWins.length - 1];

    if (lastPVEWin && lastPVPWin) {
      const mostRecentWin = lastPVEWin.dateTime > lastPVPWin.dateTime ? lastPVEWin : lastPVPWin;
      // Use NPC lookup for PVE, direct name for PVP
      lastKilledActor.actorName = mostRecentWin.npcClass ? getNPCName(mostRecentWin.npcClass) : mostRecentWin.playerClass;
      lastKilledActor.time = mostRecentWin.dateTime;
    } else if (lastPVEWin) {
      lastKilledActor.actorName = getNPCName(lastPVEWin.npcClass);
      lastKilledActor.time = lastPVEWin.dateTime;
    } else if (lastPVPWin) {
      lastKilledActor.actorName = lastPVPWin.playerClass;
      lastKilledActor.time = lastPVPWin.dateTime;
    } else {
      lastKilledActor.actorName = 'No one yet!';
      lastKilledActor.time = null;
    }
    return lastKilledActor;
  };

  const value = {
    userData,
    updateUserData,
    logInfo,
    PVEData,
    updatePVEData,
    PVPData,
    updatePVPData,
    lastKilledBy,
    lastKilledActor,
    nearbyPlayers,
    pveLog,
    pvpLog,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
