import { loadUser } from '../../lib/user/userUtil.js';
import { submitNPCtoDictionary } from '../../lib/pve/submitNPCtoDictionary.js';
import { submitWeaponToDictionary } from '../../lib/pve/submitWeaponToDictionary.js';
import { loadPVE, savePVE, addPVELogEntry } from '../../lib/pve/pveUtil.js';
import { loadPVP, savePVP, addPVPLogEntry } from '../../lib/pvp/pvpUtil.js';
import { loadWeapon, saveWeapon, addWeaponLogEntry, updateWeaponStats } from '../../lib/weapon/weaponUtil.js';
import { reportPVEKill, reportPVPKill, reportPVPDeath, reportSuicide } from '../../lib/discord/discordUtil.js';
import { queueKDUpdate } from '../../lib/utils.js';
import NPCDictionary from '../../assets/NPC-Dictionary.json';
import shipDictionary from '../../assets/Ship-Dictionary.json';
import weaponDictionary from '../../assets/Weapon-Dictionary.json';

// Helper function to extract weapon information from log line
function extractWeaponInfo(line) {
  const weaponMatch = line.match(/(?<=using\s').*?(?=_\d+'\s\[Class\s)/);
  const weaponClassMatch = line.match(/(?<=\[Class\s).*?(?=\]\swith\sdamage\stype)/);

  if (weaponMatch && weaponMatch[0] && weaponClassMatch && weaponClassMatch[0]) {
    return {
      weaponClass: weaponClassMatch[0].trim(),
      weaponId: weaponMatch[0].trim(),
    };
  }
  return null;
}

export async function actorDeath(line) {
  const pveData = await loadPVE();
  const pvpData = await loadPVP();
  const weaponData = await loadWeapon();
  try {
    let userData = await loadUser();
    const userName = userData.userName;
    const currentShipClass = userData.currentShipClass;

    // === Suicide Handler ===
    if (line.includes("'" + userName + "' [Class Player] with damage type 'Suicide'")) {
      console.log('you committed suicide');
      addPVELogEntry('suicide', 'loss');

      await queueKDUpdate(async () => {
        const updatedPVE = { ...pveData };
        updatedPVE.deaths += 1;
        updatedPVE.currentMonth.deaths += 1;
        await savePVE(updatedPVE);
      });

      await reportSuicide();
      return;
    }

    // === PVE KILL HANDLER ===
    if (line.includes("killed by '" + userName + "'") && !line.includes("<Actor Death> CActor::Kill: '" + userName + "'")) {
      console.log('🔍 Processing PVE kill line:', line);
      const npcClass = line.match(/(?<=CActor::Kill:\s').*?(?=_\d{11,14}'\s\[\d+\]\sin\szone)/);
      console.log('🎯 NPC Class match result:', npcClass);
      if (npcClass && npcClass[0]) {
        const npcClassKey = npcClass[0];

        // Extract weapon information
        const weaponInfo = extractWeaponInfo(line);
        let weaponClassKey = null;

        if (weaponInfo) {
          weaponClassKey = weaponInfo.weaponClass;

          // Check if weapon is in dictionary, if not submit it
          if (!weaponDictionary.dictionary[weaponClassKey]) {
            submitWeaponToDictionary(weaponClassKey);
          }

          // Update weapon statistics
          await updateWeaponStats(weaponClassKey, 'win');
          addWeaponLogEntry(weaponClassKey, 'win', 'npc');

          console.log('you killed with weapon: ' + (weaponDictionary.dictionary[weaponClassKey]?.name || weaponClassKey));
        }

        if (NPCDictionary.dictionary[npcClassKey]) {
          console.log('you killed a ' + NPCDictionary.dictionary[npcClassKey].name);
        } else {
          submitNPCtoDictionary(npcClassKey);
        }

        addPVELogEntry(npcClassKey, 'win', weaponClassKey);

        await queueKDUpdate(async () => {
          const updatedPVE = { ...pveData };
          updatedPVE.kills += 1;
          updatedPVE.currentMonth.kills += 1;
          updatedPVE.xp = (updatedPVE.xp || 0) + 10; // 🎯 XP GAIN
          console.log('PVE XP Update:', { oldXP: pveData.xp || 0, newXP: updatedPVE.xp, npcClass: npcClassKey });
          await savePVE(updatedPVE);
        });

        console.log('📡 Calling Discord PVE kill report with:', { npcClassKey, currentShipClass, weaponClassKey });
        await reportPVEKill(npcClassKey, currentShipClass && currentShipClass !== '' ? currentShipClass : null, weaponClassKey);
      } else {
        // === PVP KILL HANDLER ===
        const playerKill = line.match(/(?<=CActor::Kill:\s').*?(?='\s\[\d{9,12})/);
        const shipClass = line.match(/(?<=\]\sin\szone\s').*(?=_[0-9]{9,14}'\skilled\sby)/);
        if (playerKill && playerKill[0]) {
          const playerKillName = playerKill[0];
          console.log('you killed the player ' + playerKillName);

          // Extract weapon information
          const weaponInfo = extractWeaponInfo(line);
          let weaponClassKey = null;

          if (weaponInfo) {
            weaponClassKey = weaponInfo.weaponClass;

            // Check if weapon is in dictionary, if not submit it
            if (!weaponDictionary.dictionary[weaponClassKey]) {
              submitWeaponToDictionary(weaponClassKey);
            }

            // Update weapon statistics
            await updateWeaponStats(weaponClassKey, 'win');
            addWeaponLogEntry(weaponClassKey, 'win', 'player');

            console.log('you killed with weapon: ' + (weaponDictionary.dictionary[weaponClassKey]?.name || weaponClassKey));
          }

          let shipClassKey = null;
          if (shipClass && shipClass[0]) {
            const extractedShipClass = shipClass[0];
            if (shipDictionary.dictionary[extractedShipClass]) {
              console.log('you killed the ship ' + shipDictionary.dictionary[extractedShipClass].name);
              shipClassKey = extractedShipClass;
            }
          }

          let usingShipClassKey = currentShipClass && typeof currentShipClass === 'string' && currentShipClass.trim() !== '' ? currentShipClass : null;
          addPVPLogEntry(playerKillName, 'win', shipClassKey, usingShipClassKey, weaponClassKey);

          await queueKDUpdate(async () => {
            const updatedPVP = { ...pvpData };
            updatedPVP.kills += 1;
            updatedPVP.currentMonth.kills += 1;
            updatedPVP.xp = (updatedPVP.xp || 0) + 20; // 🎯 XP GAIN
            console.log('PVP XP Update:', { oldXP: pvpData.xp || 0, newXP: updatedPVP.xp, playerKill: playerKillName });
            await savePVP(updatedPVP);
          });

          await reportPVPKill(playerKillName, shipClassKey, currentShipClass && typeof currentShipClass === 'string' && currentShipClass.trim() !== '' ? currentShipClass : null, weaponClassKey);
        }
      }
    }

    // === PVE DEATH HANDLER ===
    if (line.includes("CActor::Kill: '" + userName + "'") && !line.includes("with damage type 'Suicide'") && !line.includes("killed by '" + userName + "'")) {
      // Check if killed by NPC (includes debris, AI ships, etc.)
      const enemyPlayer = line.match(/(?<=killed\sby\s').*?(?='\s\[\d{9,13}\]\susing)/);

      // If we can't find a player name pattern, or if the killer has a long ID (like debris/AI), treat as PVE death
      if (!enemyPlayer || !enemyPlayer[0] || enemyPlayer[0].length > 20 || enemyPlayer[0].includes('SCItem_') || enemyPlayer[0].includes('AI_')) {
        console.log('you were killed by NPC/environment');

        await queueKDUpdate(async () => {
          const updatedPVE = { ...pveData };
          updatedPVE.deaths += 1;
          updatedPVE.currentMonth.deaths += 1;
          await savePVE(updatedPVE);
        });

        // No Discord notification for PVE deaths (as per current design)
        return;
      }

      // === PVP DEATH HANDLER ===
      if (enemyPlayer && enemyPlayer[0]) {
        const enemyPlayerName = enemyPlayer[0];
        console.log('you were killed by player ' + enemyPlayerName);

        // Extract killer's weapon information
        const weaponInfo = extractWeaponInfo(line);
        let killerWeaponClassKey = null;

        if (weaponInfo) {
          killerWeaponClassKey = weaponInfo.weaponClass;

          // Check if weapon is in dictionary, if not submit it
          if (!weaponDictionary.dictionary[killerWeaponClassKey]) {
            submitWeaponToDictionary(killerWeaponClassKey);
          }

          console.log('you were killed by weapon: ' + (weaponDictionary.dictionary[killerWeaponClassKey]?.name || killerWeaponClassKey));
        }

        // Extract killer's ship class - only if this is a ship kill (not ground kill)
        let killerShipClassKey = null;
        if (line.includes('using')) {
          const killerShipClass = line.match(/(?<=killed\sby\s'.*?'\s[\d{9,13}\]\susing\s').*?(?=_[0-9]{9,14}')/);
          if (killerShipClass && killerShipClass[0]) {
            const extractedKillerShipClass = killerShipClass[0];
            if (shipDictionary.dictionary[extractedKillerShipClass]) {
              console.log('you were killed by a ' + shipDictionary.dictionary[extractedKillerShipClass].name);
              killerShipClassKey = extractedKillerShipClass;
            } else {
              console.log('killed on ground (weapon: ' + extractedKillerShipClass + ')');
            }
          } else {
            console.log('killed on ground (no ship/weapon info)');
          }
        } else {
          console.log('killed on ground (no ship involved)');
        }

        // Use current ship class as victim's ship (null if on ground or no ship)
        let victimShipClassKey = currentShipClass && typeof currentShipClass === 'string' && currentShipClass.trim() !== '' ? currentShipClass : null;

        addPVPLogEntry(enemyPlayerName, 'loss', killerShipClassKey, victimShipClassKey, null, killerWeaponClassKey);

        await queueKDUpdate(async () => {
          const updatedPVP = { ...pvpData };
          updatedPVP.deaths += 1;
          updatedPVP.currentMonth.deaths += 1;
          await savePVP(updatedPVP);
        });

        await reportPVPDeath(enemyPlayerName, killerShipClassKey, victimShipClassKey, killerWeaponClassKey);
      }
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    return null;
  }
}
