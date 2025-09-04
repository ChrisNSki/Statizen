import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { InfoIcon } from 'lucide-react';
import { handleOpenFile } from '@/lib/handleOpenFile';

function GeneralSettings({ settings, updateSettings }) {
  const handleLogPath = async () => {
    const path = await handleOpenFile();
    if (path) {
      updateSettings('logPath', path);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='space-y-4'>
        <div>
          <h3 className='text-lg font-semibold'>General Settings</h3>
          <p className='text-sm text-muted-foreground'>Configure basic application settings and file paths</p>
        </div>
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
    </div>
  );
}

export default GeneralSettings;
