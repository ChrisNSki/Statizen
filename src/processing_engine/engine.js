import { vehicleControlFlow } from './rules/vehicleControlFlow.js';
import { actorDeath } from './rules/actorDeath.js';
import { loadSettings } from '../lib/settings/settingsUtil.js';
import { spawnFlow } from './rules/spawnFlow.js';
import { stallFlow } from './rules/stallFlow.js';
import { corpse } from './rules/corpse.js';

export async function engineRunner(_line, type) {
  const settings = loadSettings();

  console.log('engineRunner called');

  switch (type) {
    case 'actorDeath': {
      console.log('actorDeath');
      await actorDeath(_line);
      break;
    }
    case 'spawnFlow': {
      console.log('spawnFlow');
      await spawnFlow(_line);
      break;
    }
    case 'stallFlow': {
      console.log('stallFlow');
      await stallFlow(_line);
      break;
    }
    case 'requestLocationInventory': {
      break;
    }
    case 'vehicleControlFlow': {
      console.log('vehicleControlFlow');
      await vehicleControlFlow(_line);
      break;
    }
    case 'corpse': {
      console.log('corpse');
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
