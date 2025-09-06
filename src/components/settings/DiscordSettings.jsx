import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { InfoIcon } from 'lucide-react';
import { useData } from '@/lib/context/data/dataContext';

// Helper function for player URLs
const getPlayerUrl = (name) => `https://robertsspaceindustries.com/en/citizens/${encodeURIComponent(name)}`;

function DiscordSettings({ settings, updateSettings, updateEventTypes }) {
  const { userData } = useData();
  const [testing, setTesting] = useState(false);
  const [testingEvent, setTestingEvent] = useState('');

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
      }
    } catch (error) {
      console.error('Error sending test Discord webhook:', error);
    } finally {
      setTesting(false);
    }
  };

  const testPVEKill = async () => {
    if (!settings?.discordEnabled || !settings?.discordWebhookUrl) return;

    setTestingEvent('pve');
    try {
      // Create a test embed without calling the real function
      const testEmbed = {
        title: '🎯 NPC Eliminated (PVE) - TEST',
        color: 0x00ccff,
        fields: [
          { name: 'Player', value: `[${userData?.userName || 'TestUser'}](${getPlayerUrl(userData?.userName || 'TestUser')})`, inline: true },
          { name: 'Target', value: 'Test NPC Pilot', inline: true },
          { name: 'Ship Used', value: 'Test Ship Class', inline: true },
          { name: 'Weapon Used', value: 'Test Weapon Class', inline: true },
          { name: 'K/D Ratio', value: '0.00', inline: true },
        ],
      };

      // Send test webhook directly
      const response = await fetch(settings.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [testEmbed] }),
      });

      if (!response.ok) {
        console.error('❌ PVE Kill test failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ PVE Kill test failed:', error);
    } finally {
      setTestingEvent('');
    }
  };

  const testPVPKill = async () => {
    if (!settings?.discordEnabled || !settings?.discordWebhookUrl) return;

    setTestingEvent('pvp');
    try {
      // Create a test embed without calling the real function
      const testEmbed = {
        title: '💀 Player Eliminated (PVP) - TEST',
        color: 0xffcc00,
        fields: [
          { name: 'Player', value: `[${userData?.userName || 'TestUser'}](${getPlayerUrl(userData?.userName || 'TestUser')})`, inline: true },
          { name: 'Target', value: '[TestPlayer](https://robertsspaceindustries.com/en/citizens/TestPlayer)', inline: true },
          { name: 'Ship Used', value: 'Test Player Ship', inline: true },
          { name: 'Victim Ship', value: 'Test Victim Ship', inline: true },
          { name: 'Weapon Used', value: 'Test Weapon', inline: true },
          { name: 'K/D Ratio', value: '0.00', inline: true },
        ],
      };

      // Send test webhook directly
      const response = await fetch(settings.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [testEmbed] }),
      });

      if (!response.ok) {
        console.error('❌ PVP Kill test failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ PVP Kill test failed:', error);
    } finally {
      setTestingEvent('');
    }
  };

  const testPVPDeath = async () => {
    if (!settings?.discordEnabled || !settings?.discordWebhookUrl) return;

    setTestingEvent('death');
    try {
      // Create a test embed without calling the real function
      const testEmbed = {
        title: '☠️ You Were Eliminated (PVP) - TEST',
        color: 0xff4444,
        fields: [
          { name: 'Victim', value: `[${userData?.userName || 'TestUser'}](${getPlayerUrl(userData?.userName || 'TestUser')})`, inline: true },
          { name: 'Killer', value: '[TestKiller](https://robertsspaceindustries.com/en/citizens/TestKiller)', inline: true },
          { name: 'Your Ship', value: 'Test Victim Ship', inline: true },
          { name: 'Killer Ship', value: 'Test Killer Ship', inline: true },
          { name: 'Killer Weapon', value: 'Test Weapon', inline: true },
          { name: 'K/D Ratio', value: '0.00', inline: true },
        ],
      };

      // Send test webhook directly
      const response = await fetch(settings.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [testEmbed] }),
      });

      if (!response.ok) {
        console.error('❌ PVP Death test failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ PVP Death test failed:', error);
    } finally {
      setTestingEvent('');
    }
  };

  const testSuicide = async () => {
    if (!settings?.discordEnabled || !settings?.discordWebhookUrl) return;

    setTestingEvent('suicide');
    try {
      // Create a test embed without calling the real function
      const testEmbed = {
        title: '🪦 Suicide Recorded - TEST',
        color: 0x23272a,
        fields: [
          { name: 'Player', value: `[${userData?.userName || 'TestUser'}](${getPlayerUrl(userData?.userName || 'TestUser')})`, inline: false },
          { name: 'Status', value: 'Self-terminated during operation. (TEST)', inline: false },
          { name: 'K/D Ratio', value: '0.00', inline: true },
        ],
      };

      // Send test webhook directly
      const response = await fetch(settings.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [testEmbed] }),
      });

      if (!response.ok) {
        console.error('❌ Suicide test failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Suicide test failed:', error);
    } finally {
      setTestingEvent('');
    }
  };

  const testLevelUp = async () => {
    if (!settings?.discordEnabled || !settings?.discordWebhookUrl) return;

    setTestingEvent('levelup');
    try {
      // Create a test embed without calling the real function
      const testEmbed = {
        title: 'RANK UP! - TEST',
        color: 0x00ff00,
        fields: [
          { name: 'Player', value: `[${userData?.userName || 'TestUser'}](${getPlayerUrl(userData?.userName || 'TestUser')})`, inline: false },
          { name: 'Old Rank', value: 'Test Rank (5)', inline: true },
          { name: 'New Rank', value: 'Test Rank (6)', inline: true },
          { name: 'Prestige', value: '0', inline: true },
        ],
      };

      // Send test webhook directly
      const response = await fetch(settings.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [testEmbed] }),
      });

      if (!response.ok) {
        console.error('❌ Level Up test failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Level Up test failed:', error);
    } finally {
      setTestingEvent('');
    }
  };

  const safeEvent = settings.eventTypes || {};

  return (
    <div className='space-y-6'>
      <div className='space-y-4'>
        <div>
          <h3 className='text-lg font-semibold'>Discord Notifications</h3>
          <p className='text-sm text-muted-foreground'>Set up Discord webhooks and configure event notifications</p>
        </div>
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

                <div className='space-y-2'>
                  <Label>Test Discord Events</Label>
                  <div className='flex flex-wrap gap-2'>
                    <Button onClick={testDiscordWebhook} disabled={testing || testingEvent !== ''} variant='outline' size='sm'>
                      {testing ? 'Testing...' : 'Basic Test'}
                    </Button>
                    <Button onClick={testPVEKill} disabled={testing || testingEvent !== ''} variant='outline' size='sm'>
                      {testingEvent === 'pve' ? 'Testing...' : 'Test PVE Kill'}
                    </Button>
                    <Button onClick={testPVPKill} disabled={testing || testingEvent !== ''} variant='outline' size='sm'>
                      {testingEvent === 'pvp' ? 'Testing...' : 'Test PVP Kill'}
                    </Button>
                    <Button onClick={testPVPDeath} disabled={testing || testingEvent !== ''} variant='outline' size='sm'>
                      {testingEvent === 'death' ? 'Testing...' : 'Test PVP Death'}
                    </Button>
                    <Button onClick={testSuicide} disabled={testing || testingEvent !== ''} variant='outline' size='sm'>
                      {testingEvent === 'suicide' ? 'Testing...' : 'Test Suicide'}
                    </Button>
                    <Button onClick={testLevelUp} disabled={testing || testingEvent !== ''} variant='outline' size='sm'>
                      {testingEvent === 'levelup' ? 'Testing...' : 'Test Level Up'}
                    </Button>
                  </div>
                  <div className='flex flex-row gap-1 items-center pt-2'>
                    <InfoIcon className='w-3 h-3' />
                    <span className='text-xs text-muted-foreground'>Test buttons will send sample Discord notifications using your current settings. Check the browser console for detailed logs.</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DiscordSettings;
