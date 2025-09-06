import { loadUser } from '../../lib/user/userUtil.js';
import { addNearbyPlayer } from '../../lib/nearby/nearbyUtil.js';

const consoleDebugging = false;

export async function corpse(line) {
  consoleDebugging && console.log('corpse.js called');
  const userData = await loadUser();
  const username = userData.userName;
  const playerName = line.match(/(?<=Player\s').*(?='\s<remote client>)/);
  consoleDebugging && console.log(playerName);
  if (!line.includes(username) && line.includes('IsCorpseEnabled'))
    if (playerName && playerName[0]) {
      await addNearbyPlayer(playerName[0], 'corpse');
    }
}
