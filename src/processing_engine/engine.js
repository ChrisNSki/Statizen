import { vehicleControlFlow } from './rules/vehicleControlFlow.js';
import { actorDeath } from './rules/actorDeath.js';
import { initializeLog } from './rules/initalizeLog.js';
import { loadSettings } from '../lib/settings/settingsUtil.js';
import { spawnFlow } from './rules/spawnFlow.js';
import { stallFlow } from './rules/stallFlow.js';
import { corpse } from './rules/corpse.js';

export function engineRunner(_line, type) {
  const settings = loadSettings();

  console.log('engineRunner called');

  switch (type) {
    case 'actorDeath': {
      console.log('actorDeath');
      actorDeath(_line);
      break;
    }
    case 'spawnFlow': {
      console.log('spawnFlow');
      spawnFlow(_line);
      break;
    }
    case 'stallFlow': {
      console.log('stallFlow');
      stallFlow(_line);
      break;
    }
    case 'requestLocationInventory': {
      break;
    }
    case 'vehicleControlFlow': {
      console.log('vehicleControlFlow');
      vehicleControlFlow(_line);
      break;
    }
    case 'corpse': {
      console.log('corpse');
      corpse(_line);
      break;
    }
    case 'endMission': {
      break;
    }
    case 'initializeLog': {
      console.log('initializeLog');
      initializeLog(settings);
      break;
    }
    default: {
      break;
    }
  }
}
