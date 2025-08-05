import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/lib/context/settings/settingsContext';
import { setRunAtStartup } from '@/lib/settings/settingsUtil';
import { InfoIcon, AlertCircle } from 'lucide-react';
import { createStartupShortcut } from '@/lib/utils/startupUtil';
import Modal from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { useData } from '@/lib/context/data/dataContext';
import { useLogProcessor } from '@/lib/context/logProcessor/logProcessorContext';
import { handleOpenFile } from '@/lib/handleOpenFile';


function Settings() {
  const { settings, loading, updateSettings, updateEventTypes, batchUpdateSettings } = useSettings();
  const { userData } = useData();
  const { startAutoLogging, stopAutoLogging } = useLogProcessor();
  const [testing, setTesting] = useState(false);
  const [showFallbackDialog, setShowFallbackDialog] = useState(false);

  // Debug: Monitor settings changes
  useEffect(() => {
    console.log('Settings changed in UI:', {
      rpgEnabled: settings?.rpgEnabled,
      discordLevelData: settings?.discordLevelData,
      levelUps: settings?.eventTypes?.levelUps,
    });
  }, [settings?.rpgEnabled, settings?.discordLevelData, settings?.eventTypes?.levelUps]);

  const handleLogPath = async () => {
    const path = await handleOpenFile();
    if (path) {
      updateSettings('logPath', path);
    }
  };

  const handleRunAtStartupFallback = async () => {
    try {
      await createStartupShortcut();
      alert('Statizen has been added to your startup programs. Please restart your computer for the changes to take effect.');
      setShowFallbackDialog(false);
    } catch (error) {
      console.error('Failed to create startup shortcut:', error);
      alert('Failed to add Statizen to startup programs. Please try again or manually add it.');
    }
  };



  const testDiscordWebhook = async () => {
    if (!settings?.discordEnabled || !settings?.discordWebhookUrl) return;

    setTesting(true);
    try {
      const response = await fetch(settings.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `${userData?.userName || 'Unknown User'} just tested the Statizen Discord link, it is up and running!`,
        }),
      });

      if (!response.ok) {
        console.error('Failed to send test Discord webhook:', response.status, response.statusText);
      } else {
        console.log('Discord webhook test successful!');
      }
    } catch (error) {
      console.error('Error sending test Discord webhook:', error);
    } finally {
      setTesting(false);
    }
  };

  if (loading || !settings) return <div>Loading Settings...</div>;

  const safeEvent = settings.eventTypes || {};

  return (
    <div className='flex flex-col gap-6 p-5'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-3xl font-bold'>Settings</h1>
        <p className='text-muted-foreground'>Manage your Statizen preferences</p>
      </div>

      <div className='space-y-6'>
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>General Settings</h3>
          <div className='space-y-4 pl-4'>
            <div className='space-y-2 w-3/4'>
              <Label htmlFor='log-path'>Game Log File</Label>
              <div className='flex flex-row w-full gap-2'>
                <Input id='log-path' className='w-full' type='text' placeholder='(e.g. C:/Program Files(x86)/StarCitizen/Live/Game.log)' value={settings.logPath} onChange={(e) => updateSettings('logPath', e.target.value)} />
                <Button onClick={handleLogPath}>Browse</Button>
              </div>
            </div>
            <div className='flex items-center justify-between'>
              <div>
                <div className='flex items-center space-x-2'>
                  <Switch checked={settings.notifications} onCheckedChange={(val) => updateSettings('notifications', val)} />
                  <p className='text-sm text-muted-foreground'>Enable push notifications (Windows overlay)</p>
                </div>
                <div className='flex flex-row gap-1 items-center pt-2 pl-2'>
                  <InfoIcon className='w-3 h-3' />
                  <span className='text-xs text-muted-foreground'>Display notifications for PVP kills only (May cause unexpected behavior)</span>
                </div>
              </div>
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <div className='flex items-center space-x-2'>
                  <Switch
                    checked={settings.autoLogEnabled}
                    onCheckedChange={async (val) => {
                      updateSettings('autoLogEnabled', val);
                      if (val) {
                        await startAutoLogging();
                      } else {
                        stopAutoLogging();
                      }
                    }}
                  />
                  <p className='text-sm text-muted-foreground'>Auto-start logging when Star Citizen launches</p>
                </div>
                <div className='flex flex-row gap-1 items-center pt-2 pl-2'>
                  <InfoIcon className='w-3 h-3' />
                  <span className='text-xs text-muted-foreground'>Monitors your Star Citizen game log file for activity. When the game launches and creates a new log file, Statizen automatically starts logging. When the game closes and log activity stops, logging automatically stops.</span>
                </div>
              </div>
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <div className='flex items-center space-x-2'>
                  <Switch
                    checked={settings.runAtStartup}
                    onCheckedChange={async (val) => {
                      updateSettings('runAtStartup', val);
                      if (val) {
                        const result = await setRunAtStartup(val);
                        if (!result) {
                          setShowFallbackDialog(true);
                        }
                      } else {
                        await setRunAtStartup(val);
                      }
                    }}
                  />
                  <p className='text-sm text-muted-foreground'>Run at Windows startup</p>
                </div>
                <div className='flex flex-row gap-1 items-center pt-2 pl-2'>
                  <InfoIcon className='w-3 h-3' />
                  <span className='text-xs text-muted-foreground'>Attempts to create a Windows Task Scheduler task (requires admin privileges). If that fails, adds Statizen to your Windows startup folder as a fallback method.</span>
                </div>

              </div>
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <div className='flex items-center space-x-2'>
                  <Switch checked={settings.minimizeOnLaunch} onCheckedChange={(val) => updateSettings('minimizeOnLaunch', val)} />
                  <p className='text-sm text-muted-foreground'>Minimize on launch</p>
                </div>
                <div className='flex flex-row gap-1 items-center pt-2 pl-2'>
                  <InfoIcon className='w-3 h-3' />
                  <span className='text-xs text-muted-foreground'>Start Statizen minimized to system tray</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='flex items-center justify-between'>
          <div>
            <p className='font-medium'>Submit Missing NPC Names</p>
            <div className='pl-4'>
              <div className='flex flex-row gap-2 items-center pt-2'>
                <Switch checked={settings.allowDictionarySubmit} onCheckedChange={(val) => updateSettings('allowDictionarySubmit', val)} />
                <p className='text-sm text-muted-foreground'>Allow sharing unknown NPC types to improve the dictionary (opt-in)</p>
              </div>
              <div className='flex flex-row gap-1 items-center pt-2 pl-2'>
                <InfoIcon className='w-3 h-3' />
                <span className='text-xs text-muted-foreground'>This will send data to the Statizen team to help improve the dictionary. By default, this is disabled.</span>
              </div>
            </div>
          </div>
        </div>

        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Level Progression System</h3>
          <Card>
            <CardContent className='space-y-4'>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <Label htmlFor='faction'>Select Your Faction</Label>
                  <Select value={settings.faction} onValueChange={(val) => updateSettings('faction', val)}>
                    <SelectTrigger className='w-[180px]'>
                      <SelectValue placeholder='Faction' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='peacekeeper'>🛡️ Peacekeeper</SelectItem>
                      <SelectItem value='outlaw'>🏴 Outlaw</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Faction Descriptions */}
                <div className='space-y-3'>
                  {settings.faction === 'outlaw' ? (
                    <div className='p-4 bg-gray-800 border border-red-500/20 rounded-lg'>
                      <div className='flex items-center gap-2 mb-2'>
                        <span className='text-2xl'>🏴</span>
                        <h4 className='font-semibold text-red-400'>Outlaw Faction</h4>
                      </div>
                      <p className='text-sm text-red-300 italic mb-2'>"The stars belong to the bold."</p>
                      <p className='text-sm text-gray-300 mb-3'>
                        Drifters, smugglers, mercs, and pirates — the Outlaw faction is made up of those who live on the edge of society. They answer to no one, bending or breaking laws as needed to survive. Whether it's seizing cargo from corp
                        convoys or taking bounties on corrupt enforcers, Outlaws carve their own path in the 'verse.
                      </p>
                      <div className='text-xs text-red-300'>
                        <p className='font-medium mb-1'>Core Traits:</p>
                        <ul className='list-disc list-inside space-y-1'>
                          <li>Ruthless independence</li>
                          <li>Operate in grey/black zones</li>
                          <li>Make their own rules</li>
                          <li>Favor high-risk, high-reward engagements</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className='p-4 bg-gray-800 border border-blue-500/20 rounded-lg'>
                      <div className='flex items-center gap-2 mb-2'>
                        <span className='text-2xl'>🛡️</span>
                        <h4 className='font-semibold text-blue-400'>Peacekeeper Faction</h4>
                      </div>
                      <p className='text-sm text-blue-300 italic mb-2'>"Order above all."</p>
                      <p className='text-sm text-gray-300 mb-3'>
                        Peacekeepers are defenders of the law and guardians of the UEE's vision for a safer, unified galaxy. From official Advocacy agents to corporate security and vigilante defenders, Peacekeepers uphold justice across lawless
                        frontiers. They strike with precision, protect civilians, and push back against chaos.
                      </p>
                      <div className='text-xs text-blue-300'>
                        <p className='font-medium mb-1'>Core Traits:</p>
                        <ul className='list-disc list-inside space-y-1'>
                          <li>Honor, duty, and discipline</li>
                          <li>Enforce UEE law and protect trade</li>
                          <li>Organized structure and lawful ops</li>
                          <li>Tactical engagement over brute force</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <div>
                  <p className='font-medium'>Enable RPG Leveling System</p>
                  <p className='text-sm text-muted-foreground'>Show rank, level, and prestige in dashboard</p>
                </div>
                <Switch
                  checked={settings.rpgEnabled}
                  onCheckedChange={async (val) => {
                    console.log('RPG toggle clicked:', val);
                    console.log('Initial settings:', {
                      rpgEnabled: settings.rpgEnabled,
                      discordLevelData: settings.discordLevelData,
                      levelUps: settings.eventTypes?.levelUps,
                    });

                    // If disabling RPG system, disable all related settings at once
                    if (!val) {
                      console.log('Disabling RPG system and related settings...');

                      // Use batch update to avoid overwriting issues
                      await batchUpdateSettings({
                        rpgEnabled: false,
                        discordLevelData: false,
                        'eventTypes.levelUps': false,
                      });

                      console.log('All RPG-related settings disabled');
                    } else {
                      // Just enable RPG system
                      await updateSettings('rpgEnabled', true);
                    }

                    console.log('RPG system updated to:', val);
                  }}
                />
              </div>

              <div className='flex flex-row gap-1 items-center pt-2'>
                <InfoIcon className='w-3 h-3' />
                <span className='text-xs text-muted-foreground'>
                  Level Progression System features track XP from kills and display your progression rank and prestige. When disabled, Discord notifications will not include level data regardless of the "Include Level Data" setting below.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Discord Notifications</h3>
          <Card>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='font-medium'>Enable Discord Notifications</p>
                  <p className='text-sm text-muted-foreground'>Send game events to Discord via webhook</p>
                </div>
                <Switch checked={settings.discordEnabled} onCheckedChange={(val) => updateSettings('discordEnabled', val)} />
              </div>

              {settings.discordEnabled && (
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='discord-webhook-url'>Discord Webhook URL</Label>
                    <Input id='discord-webhook-url' type='url' placeholder='https://discord.com/api/webhooks/...' value={settings.discordWebhookUrl} onChange={(e) => updateSettings('discordWebhookUrl', e.target.value)} />
                    <div className='flex flex-row gap-1 items-center pt-2'>
                      <InfoIcon className='w-3 h-3' />
                      <span className='text-xs text-muted-foreground'>Create a webhook in your Discord server settings to get the URL</span>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label>Event Types</Label>
                    <div className='space-y-2'>
                      <div className='flex items-center space-x-2'>
                        <Switch id='pvp-kills' checked={safeEvent.pvpKills} onCheckedChange={(val) => updateEventTypes('pvpKills', val)} />
                        <Label htmlFor='pvp-kills'>PVP Kills</Label>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <Switch id='pvp-deaths' checked={safeEvent.pvpDeaths} onCheckedChange={(val) => updateEventTypes('pvpDeaths', val)} />
                        <Label htmlFor='pvp-deaths'>PVP Deaths</Label>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <Switch id='pve-kills' checked={safeEvent.pveKills} onCheckedChange={(val) => updateEventTypes('pveKills', val)} />
                        <Label htmlFor='pve-kills'>PVE Kills</Label>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <Switch id='suicides' checked={safeEvent.suicides} onCheckedChange={(val) => updateEventTypes('suicides', val)} />
                        <Label htmlFor='suicides'>Suicides</Label>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <Switch id='level-ups' checked={safeEvent.levelUps} onCheckedChange={(val) => updateEventTypes('levelUps', val)} />
                        <Label htmlFor='level-ups'>Level Ups</Label>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <Switch id='level-data' checked={settings.discordLevelData} onCheckedChange={(val) => updateSettings('discordLevelData', val)} />
                        <Label htmlFor='level-data'>Include Level Data</Label>
                      </div>
                    </div>
                  </div>

                  <div className='flex gap-2 w-full justify-end'>
                    <Button onClick={testDiscordWebhook} disabled={testing}>
                      {testing ? 'Testing...' : 'Test Discord Webhook'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showFallbackDialog}
        onClose={() => setShowFallbackDialog(false)}
        title="Failed to Create Task Scheduler"
        actions={
          <>
            <Button variant="outline" onClick={() => setShowFallbackDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRunAtStartupFallback}>
              Add to Startup Folder
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Statizen failed to create a Task Scheduler task. This might be due to missing permissions.
          Would you like to add Statizen to your startup folder instead? This is a simpler method that works for most users.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          For detailed error information, check the startup_debug.log file in your Statizen data folder.
        </p>
      </Modal>
    </div>
  );
}

export default Settings;
