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

// Debug flag - set to false to disable console logging
const consoleDebugging = false;

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

// Helper function to extract ship weapon information from log line
function extractShipWeaponInfo(line) {
  const weaponMatch = line.match(/(?<=using\s').*?(?=_\d+'\s\[Class\s)/);
  const weaponClassMatch = line.match(/(?<=\[Class\s).*?(?=\]\swith\sdamage\stype)/);

  if (weaponMatch && weaponMatch[0]) {
    // For ship weapons, use the weapon ID as the class when class is "unknown"
    let weaponClass = 'unknown';
    if (weaponClassMatch && weaponClassMatch[0] && weaponClassMatch[0].trim() !== 'unknown') {
      weaponClass = weaponClassMatch[0].trim();
    } else {
      // Use weapon ID as class for ship weapons
      weaponClass = weaponMatch[0].trim();
    }

    return {
      weaponClass: weaponClass,
      weaponId: weaponMatch[0].trim(),
    };
  }
  return null;
}

// Helper function to extract ship class from zone information
function extractShipClassFromZone(line) {
  const zoneMatch = line.match(/(?<=in\szone\s').*?(?=_[0-9]{9,14}'\s)/);

  if (zoneMatch && zoneMatch[0]) {
    const zoneString = zoneMatch[0];

    // Check if any ship class from the dictionary exists in the zone string
    for (const shipClass in shipDictionary.dictionary) {
      if (zoneString.includes(shipClass)) {
        return shipClass;
      }
    }

    // If no exact match found, try to extract common ship patterns
    const shipPatterns = [
      /([A-Z]{2,5}_[A-Za-z0-9_]+)/, // Pattern like ORIG_100i, MISC_Prospector, etc.
      /([A-Z]{2,5}_[A-Za-z0-9]+_[A-Za-z0-9]+)/, // Pattern like AEGS_Vanguard_Sentinel
    ];

    for (const pattern of shipPatterns) {
      const match = zoneString.match(pattern);
      if (match && match[1]) {
        // Check if this extracted pattern exists in ship dictionary
        if (shipDictionary.dictionary[match[1]]) {
          return match[1];
        }
      }
    }
  }

  return null;
}

export async function actorDeath(line) {
  consoleDebugging && console.log('🔍 Processing actorDeath line:', line);
  const pveData = await loadPVE();
  const pvpData = await loadPVP();
  const weaponData = await loadWeapon();
  try {
    let userData = await loadUser();
    const userName = userData.userName;
    const currentShipClass = userData.currentShipClass;
    consoleDebugging && console.log('👤 Current user:', userName);

    // === Suicide Handler ===
    consoleDebugging && console.log('🔍 Checking for suicide pattern...');
    consoleDebugging && console.log('🔍 Looking for pattern:', "damage type 'Suicide'");
    consoleDebugging && console.log('🔍 Line contains userName:', line.includes(userName));
    consoleDebugging && console.log('🔍 Line contains [Class Player]:', line.includes('[Class Player]'));
    consoleDebugging && console.log('🔍 Line contains damage type Suicide:', line.includes("damage type 'Suicide'"));
    consoleDebugging && console.log('🔍 Line contains "killed by \'' + userName + '\'":', line.includes("killed by '" + userName + "'"));

    // Extract and log the actual damage type
    const damageTypeMatch = line.match(/with damage type '([^']+)'/);
    consoleDebugging && console.log('🔍 Actual damage type in line:', damageTypeMatch ? damageTypeMatch[1] : 'none found');

    if (line.includes("damage type 'Suicide'") && line.includes("killed by '" + userName + "'")) {
      consoleDebugging && console.log('✅ Suicide detected!');
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
    consoleDebugging && console.log('🔍 Checking for PVE kill pattern...');
    consoleDebugging && console.log('🔍 Looking for "killed by \'' + userName + '\'":', line.includes("killed by '" + userName + "'"));
    consoleDebugging && console.log('🔍 Line does NOT contain "<Actor Death> CActor::Kill: \'' + userName + '\'":', !line.includes("<Actor Death> CActor::Kill: '" + userName + "'"));

    if (line.includes("killed by '" + userName + "'") && !line.includes("<Actor Death> CActor::Kill: '" + userName + "'")) {
      consoleDebugging && console.log('✅ PVE KILL DETECTED!');
      consoleDebugging && console.log('🔍 Processing PVE kill line:', line);
      const npcClass = line.match(/(?<=CActor::Kill:\s').*?(?=_\d{11,14}'\s\[\d+\]\sin\szone)/);
      consoleDebugging && console.log('🎯 NPC Class match result:', npcClass);
      consoleDebugging && console.log('🎯 NPC Class key:', npcClass ? npcClass[0] : 'null');
      if (npcClass && npcClass[0]) {
        const npcClassKey = npcClass[0];
        consoleDebugging && console.log('✅ NPC Class key extracted:', npcClassKey);

        // Check if this is a ship kill (has VehicleDestruction damage type)
        const isShipKill = line.includes("with damage type 'VehicleDestruction'");

        // Extract weapon information based on kill type
        let weaponInfo = null;
        let weaponClassKey = null;

        if (isShipKill) {
          // Use ship weapon extraction for ship kills
          weaponInfo = extractShipWeaponInfo(line);
        } else {
          // Use regular weapon extraction for ground kills
          weaponInfo = extractWeaponInfo(line);
        }

        if (weaponInfo) {
          weaponClassKey = weaponInfo.weaponClass;

          // Check if weapon is in dictionary, if not submit it
          if (!weaponDictionary.dictionary[weaponClassKey]) {
            submitWeaponToDictionary(weaponClassKey);
          }

          // Update weapon statistics
          await updateWeaponStats(weaponClassKey, 'win');
          addWeaponLogEntry(weaponClassKey, 'win', 'npc');

          consoleDebugging && console.log('you killed with weapon: ' + (weaponDictionary.dictionary[weaponClassKey]?.name || weaponClassKey));
        }

        // Extract ship class if this is a ship kill
        let killedShipClass = null;
        if (isShipKill) {
          killedShipClass = extractShipClassFromZone(line);
          if (killedShipClass) {
            console.log('you killed a ship: ' + (shipDictionary.dictionary[killedShipClass]?.name || killedShipClass));
          }
        }

        if (NPCDictionary.dictionary[npcClassKey]) {
          consoleDebugging && console.log('you killed a ' + NPCDictionary.dictionary[npcClassKey].name);
        } else {
          submitNPCtoDictionary(npcClassKey);
        }

        addPVELogEntry(npcClassKey, 'win', weaponClassKey);

        consoleDebugging && console.log('🔄 Starting queueKDUpdate for PVE kill...');
        try {
          await queueKDUpdate(async () => {
            const updatedPVE = { ...pveData };
            updatedPVE.kills += 1;
            updatedPVE.currentMonth.kills += 1;
            updatedPVE.xp = (updatedPVE.xp || 0) + 10; // 🎯 XP GAIN
            consoleDebugging && console.log('PVE XP Update:', { oldXP: pveData.xp || 0, newXP: updatedPVE.xp, npcClass: npcClassKey });
            consoleDebugging && console.log('💾 About to save PVE data...');
            try {
              await savePVE(updatedPVE);
              consoleDebugging && console.log('✅ PVE data saved successfully');
            } catch (saveError) {
              console.error('❌ Failed to save PVE data:', saveError);
              throw saveError;
            }
          });
          consoleDebugging && console.log('✅ queueKDUpdate completed for PVE kill');
        } catch (error) {
          console.error('❌ queueKDUpdate failed for PVE kill:', error);
        }

        consoleDebugging && console.log('🔍 About to call Discord PVE kill report...');
        consoleDebugging && console.log('📡 Calling Discord PVE kill report with:', { npcClassKey, currentShipClass, weaponClassKey });
        try {
          const discordResult = await reportPVEKill(npcClassKey, currentShipClass && currentShipClass !== '' ? currentShipClass : null, weaponClassKey);
          consoleDebugging && console.log('📡 Discord PVE kill result:', discordResult);
        } catch (error) {
          console.error('❌ Discord PVE kill error:', error);
        }
        return; // 🎯 FIX: Add return to prevent fallthrough to PVE death handler
      } else {
        // === PVP KILL HANDLER ===
        console.log('🔍 Checking for PVP kill pattern...');
        const playerKill = line.match(/(?<=CActor::Kill:\s').*?(?='\s\[\d{9,12})/);
        const shipClass = line.match(/(?<=\]\sin\szone\s').*(?=_[0-9]{9,14}'\skilled\sby)/);
        console.log('🎯 Player kill match result:', playerKill);
        console.log('🎯 Ship class match result:', shipClass);

        if (playerKill && playerKill[0]) {
          const playerKillName = playerKill[0];
          console.log('✅ PVP KILL DETECTED! Player:', playerKillName);

          // Check if this is a ship kill (has VehicleDestruction damage type)
          const isShipKill = line.includes("with damage type 'VehicleDestruction'");

          // Extract weapon information based on kill type
          let weaponInfo = null;
          let weaponClassKey = null;

          if (isShipKill) {
            // Use ship weapon extraction for ship kills
            weaponInfo = extractShipWeaponInfo(line);
          } else {
            // Use regular weapon extraction for ground kills
            weaponInfo = extractWeaponInfo(line);
          }

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
    console.log('🔍 Checking for PVE death pattern...');
    console.log('🔍 Looking for "CActor::Kill: \'' + userName + '\'":', line.includes("CActor::Kill: '" + userName + "'"));
    console.log('🔍 Line does NOT contain "with damage type \'Suicide\'":', !line.includes("with damage type 'Suicide'"));
    console.log('🔍 Line does NOT contain "killed by \'' + userName + '\'":', !line.includes("killed by '" + userName + "'"));

    if (line.includes("CActor::Kill: '" + userName + "'") && !line.includes("with damage type 'Suicide'") && !line.includes("killed by '" + userName + "'")) {
      console.log('✅ PVE DEATH DETECTED!');
      // Check if killed by NPC (includes debris, AI ships, etc.)
      const enemyPlayer = line.match(/(?<=killed\sby\s').*?(?='\s\[\d{9,13}\]\susing)/);
      console.log('🎯 Enemy player match result:', enemyPlayer);

      // If we can't find a player name pattern, or if the killer has a long ID (like debris/AI), treat as PVE death
      if (!enemyPlayer || !enemyPlayer[0] || enemyPlayer[0].length > 20 || enemyPlayer[0].includes('SCItem_') || enemyPlayer[0].includes('AI_')) {
        console.log('✅ Confirmed PVE death - killed by NPC/environment');

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
        console.log('✅ PVP DEATH DETECTED! Killed by player:', enemyPlayerName);

        // Check if this is a ship kill (has VehicleDestruction damage type)
        const isShipKill = line.includes("with damage type 'VehicleDestruction'");

        // Extract killer's weapon information based on kill type
        let weaponInfo = null;
        let killerWeaponClassKey = null;

        if (isShipKill) {
          // Use ship weapon extraction for ship kills
          weaponInfo = extractShipWeaponInfo(line);
        } else {
          // Use regular weapon extraction for ground kills
          weaponInfo = extractWeaponInfo(line);
        }

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
