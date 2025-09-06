import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { InfoIcon } from 'lucide-react';
import FactionSelector from '@/components/FactionSelector';

function LevelProgressionSettings({ settings, updateSettings, batchUpdateSettings }) {
  return (
    <div className='space-y-6'>
      <div className='space-y-4'>
        <div>
          <h3 className='text-lg font-semibold'>Level Progression System</h3>
          <p className='text-sm text-muted-foreground'>Configure RPG-style progression and faction settings</p>
        </div>
        <Card>
          <CardContent className='space-y-4'>
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
            <FactionSelector faction={settings.faction} onFactionChange={(val) => updateSettings('faction', val)} />

            <div className='flex flex-row gap-1 items-center pt-2'>
              <InfoIcon className='w-3 h-3' />
              <span className='text-xs text-muted-foreground'>
                Level Progression System features track XP from kills and display your progression rank and prestige. When disabled, Discord notifications will not include level data regardless of the "Include Level Data" setting below.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default LevelProgressionSettings;
