import React from 'react';
import { useData } from '@/lib/context/data/dataContext';
import { useSettings } from '@/lib/context/settings/settingsContext';

const XPBarOverlay = () => {
  const { PVEData, PVPData } = useData();
  const { settings } = useSettings();

  // XP calculation logic from Dashboard
  const getXPProgressBar = (xp) => {
    const getLevelFromXP = (xp) => Math.floor(0.1 * Math.sqrt(xp));
    const getXPForLevel = (level) => Math.pow(level / 0.1, 2);

    const level = getLevelFromXP(xp);
    const xpStart = getXPForLevel(level);
    const xpEnd = getXPForLevel(level + 1);
    const xpInLevel = xp - xpStart;
    const xpNeeded = xpEnd - xpStart;
    const percent = (xpInLevel / xpNeeded) * 100;

    const imageIndex = Math.min(Math.max(Math.floor(percent), 0), 100);
    const progressBarUrl = `https://statizen-progressbar.pages.dev/progress/progressbar-${imageIndex}.png`;

    return {
      progressBarUrl,
      percent: Math.round(percent),
      level,
      xpInLevel,
      xpNeeded,
    };
  };

  const getOutlawRankTitle = (level) => {
    const ranks = ['Drifter', 'Rogue', 'Gunner', 'Marauder', 'Ravager', 'Skullbrand', 'Void Reaper', 'Ash Warden', 'Hellbringer', 'Death Harbinger'];
    const levelInCycle = ((level - 1) % 100) + 1;
    const rankIndex = Math.floor((levelInCycle - 1) / 10);
    return ranks[Math.min(rankIndex, ranks.length - 1)];
  };

  const getOutlawPrestigeTitle = (prestige) => {
    const titles = ['Scavver', 'Red Flag', 'Blackwake', 'Warrant Ghost', 'Hullsplitter', 'Star Scourge', 'Quantum Raider', 'Ashborne', 'Fleetbreaker', 'Versebane'];
    return titles[Math.min(prestige, titles.length - 1)];
  };

  const getPeacekeeperRankTitle = (level) => {
    const ranks = ['Recruit', 'Sentinel', 'Marksman', 'Enforcer', 'Vanguard', 'Ironbrand', 'Void Warden', 'Starseeker', 'Lightbringer', 'Peacebringer'];
    const levelInCycle = ((level - 1) % 100) + 1;
    const rankIndex = Math.floor((levelInCycle - 1) / 10);
    return ranks[Math.min(rankIndex, ranks.length - 1)];
  };

  const getPeacekeeperPrestigeTitle = (prestige) => {
    const titles = ['Spacer', 'White Flag', 'Starwake', 'Warrant Seeker', 'Hullguard', 'Starward Shield', 'Quantum Sentinel', 'Solarborn', 'Fleetwarden', 'Versekeeper'];
    return titles[Math.min(prestige, titles.length - 1)];
  };

  const pveXP = PVEData?.xp || 0;
  const pvpXP = PVPData?.xp || 0;
  const xp = pveXP + pvpXP;
  const { level, progressBarUrl, percent, xpInLevel, xpNeeded } = getXPProgressBar(xp);
  const prestige = Math.floor(level / 100);
  const isOutlaw = settings?.faction === 'outlaw';
  const rankTitle = isOutlaw ? getOutlawRankTitle(level) : getPeacekeeperRankTitle(level);
  const prestigeTitle = isOutlaw ? getOutlawPrestigeTitle(prestige) : getPeacekeeperPrestigeTitle(prestige);

  return (
    <div className='overlay-panel backdrop-blur-md border rounded-lg px-4 py-3 text-white text-sm min-w-[200px] shadow-2xl transition-all duration-300'>
      <div className='overlay-title font-semibold mb-2 text-xs uppercase tracking-wider'>XP Progress</div>
      <div className='text-xs leading-tight space-y-2'>
        <div className='flex justify-between items-center'>
          <span className='text-blue-400'>Rank {level}</span>
          <span className='text-blue-400'>{rankTitle}</span>
        </div>
        <div className='flex justify-between items-center'>
          <span className='text-blue-400'>Prestige {prestige}</span>
          <span className='text-blue-400'>{prestigeTitle}</span>
        </div>
        <div className='w-full'>
          <img
            src={progressBarUrl}
            alt={`Progress bar ${percent}%`}
            className='w-full h-3 object-cover rounded'
            onError={(e) => {
              console.error('Failed to load progress bar image:', progressBarUrl);
              e.target.style.display = 'none';
            }}
          />
          <div className='flex justify-between w-full mt-1'>
            <div className='text-xs text-muted-foreground'>{percent}%</div>
            <div className='text-xs text-muted-foreground'>
              {Math.floor(xpInLevel)} / {Math.floor(xpNeeded)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XPBarOverlay;
