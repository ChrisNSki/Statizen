import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin, Target, Skull, User, Zap, Clock, UserCheck, Gamepad2, Rocket, Activity, AlertCircle, Play, Square, FileText, BadgePlus, PersonStanding, CircleOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLogProcessor } from '@/lib/context/logProcessor/logProcessorContext';
import { useData } from '@/lib/context/data/dataContext';
import { useSettings } from '@/lib/context/settings/settingsContext';
import { initializeLog } from '@/lib/initialization/initializeLog';
import { formatTimeAgo } from '@/lib/utils';

// Copy the exact same functions from Discord utility
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

function Dashboard() {
  const { isWatching, toggleLogging, autoLogEnabled } = useLogProcessor();
  const { settings } = useSettings();
  const { userData, logInfo, PVEData, PVPData, OrgData, lastKilledBy, lastKilledActor, nearbyPlayers } = useData();

  const startLogging = async () => {
    if (!isWatching) {
      try {
        await initializeLog(settings);
        await toggleLogging();
      } catch (error) {
        console.error('Failed to start logging:', error);
      }
    } else {
      await toggleLogging();
    }
  };

  const isOutlaw = settings?.faction === 'outlaw';

  // Calculate level and prestige from XP using real-time data from context (same as Discord webhook)
  // Combine PVE and PVP XP for total progression
  const pveXP = PVEData?.xp || 0;
  const pvpXP = PVPData?.xp || 0;
  const xp = pveXP + pvpXP;
  const { level, progressBarUrl, percent, xpInLevel, xpNeeded } = getXPProgressBar(xp);
  // Calculate prestige from level: every 100 levels = 1 prestige
  const prestige = Math.floor(level / 100);
  const factionDisplay = isOutlaw ? 'Outlaw' : 'Peacekeeper';

  // Use exact same calculation as Discord webhook
  const rankTitle = getRankTitle(level, isOutlaw);
  const prestigeTitle = getPrestigeTitle(prestige, isOutlaw);

  // Simplified logic - check if currentShip has a value
  const isInShip = userData?.currentShip && userData.currentShip.trim() !== '';

  return (
    <div className='flex flex-col gap-2 p-5 h-full'>
      <div className='flex flex-row w-full gap-2 flex-1'>
        <div className='flex flex-col gap-2 w-1/3 min-w-0'>
          {/* Main Stats Cards */}
          <Card className='flex-1'>
            <CardHeader>
              <div className='flex items-center gap-2'>
                <Rocket className='w-5 h-5 text-blue-600' />
                <CardTitle>{isInShip ? 'Current Ship' : 'Status'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <span className={`flex text-nowrap font-bold ${(userData?.currentShip?.length || 0) > 28 ? 'text-xs' : (userData?.currentShip?.length || 0) > 22 ? 'text-md' : 'text-xl'}`}>{isInShip ? userData.currentShip : 'On Foot'}</span>
            </CardContent>
          </Card>
          <Card className='flex-1'>
            <CardHeader>
              <div className='flex items-center gap-2'>
                <Target className='w-5 h-5 text-green-600' />
                <CardTitle>PVP K/D Ratio</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className='text-xl font-bold text-green-600'>{PVPData?.deaths === 0 ? PVPData?.kills : (PVPData?.kills / PVPData?.deaths).toFixed(2)}</p>
              <CardDescription>
                {PVPData?.kills} kills / {PVPData?.deaths} deaths
              </CardDescription>
            </CardContent>
          </Card>
          <Card className='flex-1'>
            <CardHeader>
              <div className='flex items-center gap-2'>
                <Skull className='w-5 h-5 text-orange-600' />
                <CardTitle>PVE K/D Ratio</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className='text-xl font-bold text-orange-600'>{PVEData?.deaths === 0 ? PVEData?.kills : (PVEData?.kills / PVEData?.deaths).toFixed(2)}</p>
              <CardDescription>
                {PVEData?.kills} kills / {PVEData?.deaths} deaths
              </CardDescription>
            </CardContent>
          </Card>
        </div>
        {/* Recent Activity */}
        <div className='flex flex-col gap-2 w-2/3 min-w-0'>
          <Card className='flex-1'>
            <CardContent className='space-y-3'>
              <div className='flex items-center justify-between p-2 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 bg-red-100 rounded-full flex items-center justify-center'>
                    <Skull className='w-4 h-4 text-red-600' />
                  </div>
                  <div>
                    <p className='font-medium'>Last Killed By</p>
                    <p className='text-sm text-muted-foreground'>{lastKilledBy?.actorName || 'No one yet!'}</p>
                  </div>
                </div>
                <div className='text-right'>
                  <p className='font-medium text-red-600'>{formatTimeAgo(lastKilledBy?.time)}</p>
                </div>
              </div>
              <div className='flex items-center justify-between p-2 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                    <Target className='w-4 h-4 text-green-600' />
                  </div>
                  <div>
                    <p className='font-medium'>Last Killed</p>
                    <p className='text-sm text-muted-foreground'>{lastKilledActor?.actorName ? (lastKilledActor.actorName.length > 42 ? lastKilledActor.actorName.slice(0, 42) + '…' : lastKilledActor.actorName) : 'No one yet!'}</p>
                  </div>
                </div>
                <div className='text-right'>
                  <p className='font-medium text-green-600'>{formatTimeAgo(lastKilledActor?.time)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className='flex-1'>
            <CardContent className='space-y-3'>
              <div className='flex justify-between px-2 rounded-lg min-h-33'>
                <div className='flex p-0'>
                  <div>
                    <div className='text-sm font-bold pt-0'>Nearby Players</div>
                    <div className='flex flex-row gap-2 pt-2 flex-wrap max-h-20 overflow-y-auto'>
                      {nearbyPlayers && nearbyPlayers.length > 0 ? (
                        nearbyPlayers.map((player, index) => {
                          let badgeStyle = '';
                          if (player.icon === 'skull') {
                            badgeStyle = 'bg-gray-700 text-white hover:bg-gray-600';
                          } else if (player.icon === 'badge-plus') {
                            badgeStyle = 'bg-blue-100 text-blue-800 hover:bg-blue-200';
                          } else if (player.icon === 'person-standing') {
                            badgeStyle = 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50';
                          }

                          return (
                            <Badge key={index} className={badgeStyle}>
                              {player.icon === 'badge-plus' ? <BadgePlus className='w-4 h-4' /> : player.icon === 'person-standing' ? <PersonStanding className='w-4 h-4' /> : <Skull className='w-4 h-4' />}
                              {player.playerName}
                            </Badge>
                          );
                        })
                      ) : (
                        <Badge variant='outline'>
                          <CircleOff className='w-4 h-4' /> No players detected
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Information */}
      <Card className='flex-shrink-0'>
        <CardContent>
          <div className='grid grid-cols-2 gap-4 max-w-2xl mx-auto'>
            <div className='flex items-center gap-3 p-3 border rounded-lg'>
              <Gamepad2 className='w-5 h-5 text-blue-600' />
              <div>
                <p className='font-medium'>Star Citizen Version</p>
                <p className='text-sm text-muted-foreground'>{userData?.starCitizenVersion || 'Unknown'}</p>
              </div>
            </div>
            <div className='flex items-center gap-3 p-3 border rounded-lg'>
              <Activity className='w-5 h-5 text-blue-600' />
              <div>
                <p className='font-medium'>Log Parser Status</p>
                <div className='flex flex-row items-center gap-2'>
                  <div className={`w-3 h-3 rounded-full ${isWatching ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <p className='text-sm text-muted-foreground'>{isWatching ? 'Live' : 'Not connected'}</p>
                </div>
              </div>
            </div>
            <div className='flex items-center gap-3 p-3 border rounded-lg'>
              <UserCheck className='w-5 h-5 text-purple-600' />
              <div>
                <p className='font-medium'>Logged in as</p>
                <p className='text-sm text-muted-foreground'>{userData?.userName || 'Unknown'}</p>
              </div>
            </div>
            <div className='flex items-center gap-3 p-3 border rounded-lg'>
              <FileText className='w-5 h-5 text-orange-600' />
              <div>
                <p className='font-medium'>Log Lines Processed</p>
                <p className='text-sm text-muted-foreground'>{logInfo?.lastProcessedLine.toString() || 'Unknown'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Logging Control */}
      <div className={`flex flex-row w-full flex-shrink-0 ${settings?.rpgEnabled ? 'justify-between' : 'justify-end'}`}>
        {settings?.rpgEnabled && (
          <Card className='py-2 flex-shrink-0'>
            <CardContent>
              <div className='flex flex-wrap pt-1 text-sm text-muted-foreground'>
                <>
                  <div className='flex flex-row gap-2 justify-between w-full'>
                    <div className='flex flex-row gap-2 items-center'>
                      <div className='text-sm font-bold'>Faction</div>
                      <div className='text-xs text-[#00CCee]'>{factionDisplay}</div>
                    </div>
                    <div className='flex flex-row gap-2 items-center'>
                      <div className='text-sm font-bold'>Prestige</div>
                      <div className='text-xs text-[#00CCee]'>
                        {prestige} - {prestigeTitle}
                      </div>
                    </div>
                    <div className='flex flex-row gap-2 items-center'>
                      <div className='text-sm font-bold'>Rank</div>
                      <div className='text-xs text-[#00CCee]'>
                        {level} - {rankTitle}
                      </div>
                    </div>
                  </div>
                  <div className='w-full mt-2'>
                    <img
                      src={progressBarUrl}
                      alt={`Progress bar ${percent}%`}
                      className='w-full h-4 object-cover rounded'
                      onError={(e) => {
                        console.error('Failed to load progress bar image:', progressBarUrl);
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className='flex justify-between w-full mt-1'>
                      <div className='text-xs text-muted-foreground mb-1'>Progress to Next Level: {percent}%</div>
                      <div className='text-xs text-muted-foreground mb-1'>
                        XP: {Math.floor(xpInLevel)} / {Math.floor(xpNeeded)}
                      </div>
                    </div>
                  </div>
                </>
              </div>
            </CardContent>
          </Card>
        )}
        <div className={`flex flex-row ${settings?.rpgEnabled ? 'flex-1 justify-center' : ''} items-center`}>
          {autoLogEnabled ? (
            <div className='flex items-center gap-3 px-4 py-2 border-2 border-green-500 rounded-lg animate-pulse'>
              <span className='text-sm font-medium text-green-600'>Auto Logging</span>
            </div>
          ) : (
            <Button onClick={startLogging} variant={isWatching ? 'destructive' : 'default'} className='flex items-center gap-2'>
              {isWatching ? (
                <>
                  <Square className='w-4 h-4' />
                  Stop Logging
                </>
              ) : (
                <>
                  <Play className='w-4 h-4' />
                  Start Logging
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
