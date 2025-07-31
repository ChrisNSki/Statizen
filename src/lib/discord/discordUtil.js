import { loadSettings } from '@/lib/settings/settingsUtil';
import { loadUser } from '@/lib/user/userUtil';
import { loadPVE } from '@/lib/pve/pveUtil';
import { loadPVP } from '@/lib/pvp/pvpUtil';
import NPCDictionary from '@/assets/NPC-Dictionary.json';
import ShipDictionary from '@/assets/Ship-Dictionary.json';
import WeaponDictionary from '@/assets/Weapon-Dictionary.json';

const getNPCName = (npcClass) => (npcClass ? NPCDictionary.dictionary[npcClass]?.name || npcClass : npcClass);
const getShipName = (shipClass) => (shipClass ? ShipDictionary.dictionary[shipClass]?.name || shipClass : shipClass);
const getWeaponName = (weaponClass) => (weaponClass ? WeaponDictionary.dictionary[weaponClass]?.name || weaponClass : weaponClass);
const calculateKDRatio = (kills, deaths) => (deaths === 0 ? kills : (kills / deaths).toFixed(2));
const getPlayerUrl = (name) => `https://robertsspaceindustries.com/en/citizens/${encodeURIComponent(name)}`;

const getOutlawRankTitle = (level) => {
  const ranks = ['Drifter', 'Rogue', 'Gunner', 'Marauder', 'Ravager', 'Skullbrand', 'Void Reaper', 'Ash Warden', 'Hellbringer', 'Death Harbinger'];
  // Calculate rank based on level within current prestige cycle (1-100)
  const levelInCycle = ((level - 1) % 100) + 1; // 1-100
  const rankIndex = Math.floor((levelInCycle - 1) / 10); // 0-9
  return ranks[Math.min(rankIndex, ranks.length - 1)];
};

const getOutlawPrestigeTitle = (prestige) => {
  const titles = ['Scavver', 'Red Flag', 'Blackwake', 'Warrant Ghost', 'Hullsplitter', 'Star Scourge', 'Quantum Raider', 'Ashborne', 'Fleetbreaker', 'Versebane'];
  return titles[Math.min(prestige, titles.length - 1)];
};

const getPeacekeeperRankTitle = (level) => {
  const ranks = ['Recruit', 'Sentinel', 'Marksman', 'Enforcer', 'Vanguard', 'Ironbrand', 'Void Warden', 'Starseeker', 'Lightbringer', 'Peacebringer'];
  // Calculate rank based on level within current prestige cycle (1-100)
  const levelInCycle = ((level - 1) % 100) + 1; // 1-100
  const rankIndex = Math.floor((levelInCycle - 1) / 10); // 0-9
  return ranks[Math.min(rankIndex, ranks.length - 1)];
};

const getPeacekeeperPrestigeTitle = (prestige) => {
  const titles = ['Spacer', 'White Flag', 'Starwake', 'Warrant Seeker', 'Hullguard', 'Starward Shield', 'Quantum Sentinel', 'Solarborn', 'Fleetwarden', 'Versekeeper'];
  return titles[Math.min(prestige, titles.length - 1)];
};

const getRankTitle = (level, isOutlaw) => (isOutlaw ? getOutlawRankTitle(level) : getPeacekeeperRankTitle(level));
const getPrestigeTitle = (prestige, isOutlaw) => (isOutlaw ? getOutlawPrestigeTitle(prestige) : getPeacekeeperPrestigeTitle(prestige));
const getLevelFromXP = (xp) => Math.floor(0.1 * Math.sqrt(xp));
const getXPForLevel = (level) => Math.pow(level / 0.1, 2);

const getXPProgressBar = (xp) => {
  const level = getLevelFromXP(xp);
  const xpStart = getXPForLevel(level);
  const xpEnd = getXPForLevel(level + 1);
  const xpInLevel = xp - xpStart;
  const xpNeeded = xpEnd - xpStart;
  const percent = (xpInLevel / xpNeeded) * 100;

  // Calculate which image to use (0-100, with 101 total images)
  const imageIndex = Math.min(Math.max(Math.floor(percent), 0), 100);
  const progressBarUrl = `https://statizen-progressbar.pages.dev/progress/progressbar-${imageIndex}.png`;

  // Validate the URL format
  if (!progressBarUrl || !progressBarUrl.startsWith('https://statizen-progressbar.pages.dev/')) {
    console.error('Invalid progress bar URL generated:', progressBarUrl);
  }

  return {
    progressBarUrl,
    percent: Math.round(percent),
    level,
    xpInLevel,
    xpNeeded,
  };
};

const sendDiscordWebhook = async (webhookUrl, embed) => {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error sending Discord webhook:', error);
    return false;
  }
};

const reportLevelUp = async (oldLevel, newLevel, oldRankTitle, newRankTitle, oldPrestige, newPrestige) => {
  const settings = await loadSettings();

  if (!settings.discordEnabled || !settings.discordWebhookUrl || !settings.eventTypes?.levelUps) {
    return false;
  }

  const user = await loadUser();
  const name = user?.userName || 'Unknown';

  let embed;

  // Check if it's a prestige level up (every 100 levels)
  if (Math.floor(newLevel / 100) > Math.floor(oldLevel / 100)) {
    embed = {
      title: 'PRESTIGE INCREASED!',
      color: 0xffd700, // Gold color for prestige
      fields: [{ name: 'Player', value: `[${name}](${getPlayerUrl(name)})`, inline: false }],
    };

    // Add rank/prestige fields only if level data is enabled
    if (settings.discordLevelData) {
      embed.fields.push({ name: 'New Prestige', value: `${newPrestige}`, inline: true }, { name: 'New Prestige Title', value: newRankTitle, inline: true }, { name: 'Level', value: `${newLevel}`, inline: true });
    }
  } else {
    embed = {
      title: 'RANK UP!',
      color: 0x00ff00, // Green color for regular level up
      fields: [{ name: 'Player', value: `[${name}](${getPlayerUrl(name)})`, inline: false }],
    };

    // Add rank/prestige fields only if level data is enabled
    if (settings.discordLevelData) {
      embed.fields.push({ name: 'Old Rank', value: `${oldRankTitle} (${oldLevel})`, inline: true }, { name: 'New Rank', value: `${newRankTitle} (${newLevel})`, inline: true }, { name: 'Prestige', value: `${newPrestige}`, inline: true });
    }
  }

  return sendDiscordWebhook(settings.discordWebhookUrl, embed);
};

export const reportPVPKill = async (victimName, victimShipClass, currentShipClass, weaponClass = null) => {
  const settings = await loadSettings();
  if (!settings.discordEnabled || !settings.discordWebhookUrl || !settings.eventTypes?.pvpKills) return false;

  const user = await loadUser();
  const pvp = await loadPVP();
  const pve = await loadPVE();
  const name = user?.userName || 'Unknown';
  // Combine PVE and PVP XP for total progression
  const pveXP = pve?.xp || 0;
  const pvpXP = pvp?.xp || 0;
  const xp = pveXP + pvpXP;
  const isOutlaw = settings.faction === 'outlaw';

  const { progressBarUrl, percent, level, xpInLevel, xpNeeded } = getXPProgressBar(xp);
  // Calculate prestige from level: every 100 levels = 1 prestige
  const prestige = Math.floor(level / 100);
  const rankTitle = getRankTitle(level, isOutlaw);
  const prestigeTitle = getPrestigeTitle(prestige, isOutlaw);

  // Build fields array dynamically
  const fields = [
    { name: 'Player', value: `[${name}](${getPlayerUrl(name)})`, inline: true },
    { name: 'Target', value: `[${victimName}](${getPlayerUrl(victimName)})`, inline: true },
  ];

  // Row 2: Victim Ship | Weapon Used | (placeholder)
  const row2Fields = [];

  if (victimShipClass && victimShipClass.trim() !== '') {
    row2Fields.push({ name: 'Victim Ship', value: getShipName(victimShipClass), inline: true });
  } else {
    row2Fields.push({ name: '\u200b', value: '\u200b', inline: true }); // Zero-width space placeholder
  }

  if (weaponClass && weaponClass.trim() !== '') {
    row2Fields.push({ name: 'Weapon Used', value: getWeaponName(weaponClass), inline: true });
  } else {
    row2Fields.push({ name: '\u200b', value: '\u200b', inline: true }); // Zero-width space placeholder
  }

  // Always add a third placeholder field to complete the row
  row2Fields.push({ name: '\u200b', value: '\u200b', inline: true }); // Zero-width space placeholder

  // Add Row 2 (always 3 fields)
  fields.push(...row2Fields);

  // Row 3: K/D Ratio (full width)
  fields.push({ name: 'K/D Ratio', value: calculateKDRatio(pvp.kills || 0, pvp.deaths || 0) });

  const embed = {
    title: '💀 Player Eliminated (PVP)',
    color: 0xffcc00,
    fields: fields,
  };

  // Add RPG fields if level data is enabled
  if (settings.discordLevelData) {
    // Row 4: Rank | Prestige | (placeholder)
    embed.fields.push(
      { name: 'Rank', value: `${rankTitle} (${level})`, inline: true },
      { name: 'Prestige', value: `${prestigeTitle} (${prestige})`, inline: true },
      { name: '\u200b', value: '\u200b', inline: true } // Zero-width space placeholder
    );

    // Add Progress to Next Level after Rank and Prestige
    embed.fields.push({
      name: `${percent}% Progress to Next Level (${Math.floor(xpInLevel)} / ${Math.floor(xpNeeded)})`,
      value: ' ',
    });

    // Add the progress bar image
    embed.image = {
      url: progressBarUrl,
    };
  }

  // Send the kill notification
  const killResult = await sendDiscordWebhook(settings.discordWebhookUrl, embed);

  // Check if this kill resulted in a level up (xpInLevel is 0 and level > 1)
  if (xpInLevel < 1 && level > 1) {
    // Changed from === 0 to < 1 for floating point precision
    // Calculate old level for the level up message
    const oldLevel = level - 1;
    const oldPrestige = Math.floor(oldLevel / 100);
    const oldRankTitle = getRankTitle(oldLevel, isOutlaw);

    // Send level up notification
    await reportLevelUp(oldLevel, level, oldRankTitle, rankTitle, oldPrestige, prestige);
  }

  return killResult;
};

export const reportPVEKill = async (npcClass, currentShipClass, weaponClass = null, killedShipClass = null) => {
  const settings = await loadSettings();
  if (!settings.discordEnabled || !settings.discordWebhookUrl || !settings.eventTypes?.pveKills) return false;

  const user = await loadUser();
  const pvp = await loadPVP();
  const pve = await loadPVE();
  const name = user?.userName || 'Unknown';
  // Combine PVE and PVP XP for total progression
  const pveXP = pve?.xp || 0;
  const pvpXP = pvp?.xp || 0;
  const xp = pveXP + pvpXP;
  const isOutlaw = settings.faction === 'outlaw';

  const { progressBarUrl, percent, level, xpInLevel, xpNeeded } = getXPProgressBar(xp);
  // Calculate prestige from level: every 100 levels = 1 prestige
  const prestige = Math.floor(level / 100);
  const rankTitle = getRankTitle(level, isOutlaw);
  const prestigeTitle = getPrestigeTitle(prestige, isOutlaw);

  // Build fields array dynamically
  const fields = [
    // Row 1: Player | Empty Placeholder | Target
    { name: 'Player', value: `[${name}](${getPlayerUrl(name)})`, inline: true },
    { name: '\u200b', value: '\u200b', inline: true }, // Zero-width space placeholder
    { name: 'Target', value: getNPCName(npcClass) || 'Unknown NPC', inline: true },
  ];

  // Row 2: Ship Used | Empty Placeholder | Target Ship
  const row2Fields = [];

  if (currentShipClass && currentShipClass !== '') {
    row2Fields.push({ name: 'Ship Used', value: getShipName(currentShipClass), inline: true });
  } else {
    row2Fields.push({ name: '\u200b', value: '\u200b', inline: true }); // Zero-width space placeholder
  }

  row2Fields.push({ name: '\u200b', value: '\u200b', inline: true }); // Zero-width space placeholder

  if (killedShipClass && killedShipClass.trim() !== '') {
    row2Fields.push({ name: 'Target Ship', value: getShipName(killedShipClass), inline: true });
  } else {
    row2Fields.push({ name: '\u200b', value: '\u200b', inline: true }); // Zero-width space placeholder
  }

  // Add Row 2 (always 3 fields)
  fields.push(...row2Fields);

  // Row 3: K/D Ratio | Empty Placeholder | Weapon Used
  const row3Fields = [];

  row3Fields.push({ name: 'K/D Ratio', value: calculateKDRatio(pve.kills || 0, pve.deaths || 0), inline: true });
  row3Fields.push({ name: '\u200b', value: '\u200b', inline: true }); // Zero-width space placeholder

  if (weaponClass && weaponClass.trim() !== '') {
    row3Fields.push({ name: 'Weapon Used', value: getWeaponName(weaponClass), inline: true });
  } else {
    row3Fields.push({ name: '\u200b', value: '\u200b', inline: true }); // Zero-width space placeholder
  }

  // Add Row 3 (always 3 fields)
  fields.push(...row3Fields);

  const embed = {
    title: '🎯 NPC Eliminated (PVE)',
    color: 0x00ccff,
    fields: fields,
  };

  // Add RPG fields if level data is enabled
  if (settings.discordLevelData) {
    // Row 4: Rank | Empty Placeholder | Prestige
    embed.fields.push(
      { name: 'Rank', value: `${rankTitle} (${level})`, inline: true },
      { name: '\u200b', value: '\u200b', inline: true }, // Zero-width space placeholder
      { name: 'Prestige', value: `${prestigeTitle} (${prestige})`, inline: true }
    );

    // Add Progress to Next Level after Rank and Prestige
    embed.fields.push({
      name: `${percent}% Progress to Next Level (${Math.floor(xpInLevel)} / ${Math.floor(xpNeeded)})`,
      value: ' ',
    });

    // Add the progress bar image
    embed.image = {
      url: progressBarUrl,
    };
  }

  // Send the kill notification
  const killResult = await sendDiscordWebhook(settings.discordWebhookUrl, embed);

  // Check if this kill resulted in a level up (xpInLevel is 0 and level > 1)
  if (xpInLevel < 1 && level > 1) {
    // Changed from === 0 to < 1 for floating point precision
    // Calculate old level for the level up message
    const oldLevel = level - 1;
    const oldPrestige = Math.floor(oldLevel / 100);
    const oldRankTitle = getRankTitle(oldLevel, isOutlaw);

    // Send level up notification
    await reportLevelUp(oldLevel, level, oldRankTitle, rankTitle, oldPrestige, prestige);
  }

  return killResult;
};

export const reportPVPDeath = async (killerName, killerShipClass, currentShipClass, killerWeaponClass = null) => {
  const settings = await loadSettings();
  if (!settings.discordEnabled || !settings.discordWebhookUrl || !settings.eventTypes?.pvpDeaths) return false;

  const user = await loadUser();
  const pvp = await loadPVP();
  const pve = await loadPVE();
  const name = user?.userName || 'Unknown';
  // Combine PVE and PVP XP for total progression
  const pveXP = pve?.xp || 0;
  const pvpXP = pvp?.xp || 0;
  const xp = pveXP + pvpXP;
  const isOutlaw = settings.faction === 'outlaw';
  const { progressBarUrl, percent, level, xpInLevel, xpNeeded } = getXPProgressBar(xp);
  // Calculate prestige from level: every 100 levels = 1 prestige
  const prestige = Math.floor(level / 100);
  const rankTitle = getRankTitle(level, isOutlaw);
  const prestigeTitle = getPrestigeTitle(prestige, isOutlaw);

  // Build fields array dynamically
  const fields = [
    { name: 'Victim', value: `[${name}](${getPlayerUrl(name)})`, inline: true },
    { name: 'Killer', value: `[${killerName}](${getPlayerUrl(killerName)})`, inline: true },
  ];

  // Only add ship fields if ship data is available
  if (currentShipClass && currentShipClass.trim() !== '') {
    fields.push({ name: 'Your Ship', value: getShipName(currentShipClass), inline: true });
  }
  if (killerShipClass && killerShipClass.trim() !== '') {
    fields.push({ name: 'Killer Ship', value: getShipName(killerShipClass), inline: true });
  }

  // Add weapon information if available
  if (killerWeaponClass && killerWeaponClass.trim() !== '') {
    fields.push({ name: 'Killer Weapon', value: getWeaponName(killerWeaponClass), inline: true });
  }

  // Add K/D Ratio
  fields.push({ name: 'K/D Ratio', value: calculateKDRatio(pvp.kills || 0, pvp.deaths || 0) });

  const embed = {
    title: '☠️ You Were Eliminated (PVP)',
    color: 0xff4444,
    fields: fields,
  };

  // Add RPG fields if level data is enabled
  if (settings.discordLevelData) {
    // Add Rank and Prestige after K/D Ratio
    embed.fields.push({ name: 'Rank', value: `${rankTitle} (${level})`, inline: true }, { name: 'Prestige', value: `${prestigeTitle} (${prestige})`, inline: true });

    // Add Progress to Next Level after Rank and Prestige
    embed.fields.push({
      name: `${percent}% Progress to Next Level (${Math.floor(xpInLevel)} / ${Math.floor(xpNeeded)})`,
      value: ' ',
    });

    // Add the progress bar image
    embed.image = {
      url: progressBarUrl,
    };
  }

  return sendDiscordWebhook(settings.discordWebhookUrl, embed);
};

export const reportSuicide = async () => {
  const settings = await loadSettings();
  if (!settings.discordEnabled || !settings.discordWebhookUrl || !settings.eventTypes?.suicides) return false;

  const user = await loadUser();
  const pve = await loadPVE();
  const pvp = await loadPVP();
  const name = user?.userName || 'Unknown';
  // Combine PVE and PVP XP for total progression
  const pveXP = pve?.xp || 0;
  const pvpXP = pvp?.xp || 0;
  const xp = pveXP + pvpXP;
  const isOutlaw = settings.faction === 'outlaw';
  const { progressBarUrl, percent, level, xpInLevel, xpNeeded } = getXPProgressBar(xp);
  // Calculate prestige from level: every 100 levels = 1 prestige
  const prestige = Math.floor(level / 100);
  const rankTitle = getRankTitle(level, isOutlaw);
  const prestigeTitle = getPrestigeTitle(prestige, isOutlaw);

  const embed = {
    title: '🪦 Suicide Recorded',
    color: 0x23272a,
    fields: [
      { name: 'Player', value: `[${name}](${getPlayerUrl(name)})`, inline: false },
      { name: 'Status', value: 'Self-terminated during operation.', inline: false },
      { name: 'K/D Ratio', value: calculateKDRatio(pvp.kills || 0, pvp.deaths || 0) },
    ],
  };

  // Add RPG fields if level data is enabled
  if (settings.discordLevelData) {
    // Add Rank and Prestige after K/D Ratio
    embed.fields.push({ name: 'Rank', value: `${rankTitle} (${level})`, inline: true }, { name: 'Prestige', value: `${prestigeTitle} (${prestige})`, inline: true });

    // Add Progress to Next Level after Rank and Prestige
    embed.fields.push({
      name: `${percent}% Progress to Next Level (${Math.floor(xpInLevel)} / ${Math.floor(xpNeeded)})`,
      value: ' ',
    });

    // Add the progress bar image
    embed.image = {
      url: progressBarUrl,
    };
  }

  return sendDiscordWebhook(settings.discordWebhookUrl, embed);
};
