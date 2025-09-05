import { vehicleControlFlow } from './rules/vehicleControlFlow.js';
import { actorDeath } from './rules/actorDeath.js';
import { loadSettings } from '../lib/settings/settingsUtil.js';
import { spawnFlow } from './rules/spawnFlow.js';
import { stallFlow } from './rules/stallFlow.js';
import { corpse } from './rules/corpse.js';
import { crashEvent } from './rules/crashEvent.js';

const consoleDebugging = false;

export async function engineRunner(_line, type) {
  const settings = loadSettings();

  consoleDebugging && console.log('engineRunner called');

  switch (type) {
    case 'actorDeath': {
      consoleDebugging && console.log('actorDeath');
      await actorDeath(_line);
      break;
    }
    case 'crashEvent': {
      consoleDebugging && console.log('crashEvent');
      await crashEvent(_line);
      break;
    }
    case 'spawnFlow': {
      consoleDebugging && console.log('spawnFlow');
      await spawnFlow(_line);
      break;
    }
    case 'stallFlow': {
      consoleDebugging && console.log('stallFlow');
      await stallFlow(_line);
      break;
    }
    case 'requestLocationInventory': {
      break;
    }
    case 'vehicleControlFlow': {
      consoleDebugging && console.log('vehicleControlFlow');
      await vehicleControlFlow(_line);
      break;
    }
    case 'corpse': {
      consoleDebugging && console.log('corpse');
      await corpse(_line);
      break;
    }
    case 'endMission': {
      break;
    }
    default: {
      break;
    }
  }
}
