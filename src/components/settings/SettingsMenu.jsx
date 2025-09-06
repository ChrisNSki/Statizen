import React from 'react';
import { Settings as SettingsIcon, Monitor, TrendingUp, MessageSquare, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

function SettingsMenu({ activeSection, onSectionChange }) {
  return (
    <div className='w-64 flex-shrink-0 bg-muted/50 border-r'>
      <div className='p-6 flex flex-col gap-2'>
        <Button variant={activeSection === 'general' ? 'default' : 'outline'} className='w-full justify-start gap-3 cursor-pointer' onClick={() => onSectionChange('general')}>
          <SettingsIcon className='w-4 h-4' />
          General Settings
        </Button>

        <Button variant={activeSection === 'overlay' ? 'default' : 'outline'} className='w-full justify-start gap-3 cursor-pointer' onClick={() => onSectionChange('overlay')}>
          <Monitor className='w-4 h-4' />
          Overlay
        </Button>

        <Button variant={activeSection === 'level-progression' ? 'default' : 'outline'} className='w-full justify-start gap-3 cursor-pointer' onClick={() => onSectionChange('level-progression')}>
          <TrendingUp className='w-4 h-4' />
          Level Progression
        </Button>

        <Button variant={activeSection === 'discord' ? 'default' : 'outline'} className='w-full justify-start gap-3 cursor-pointer' onClick={() => onSectionChange('discord')}>
          <MessageSquare className='w-4 h-4' />
          Discord Notifications
        </Button>

        <Button variant={activeSection === 'about' ? 'default' : 'outline'} className='w-full justify-start gap-3 cursor-pointer' onClick={() => onSectionChange('about')}>
          <Info className='w-4 h-4' />
          About
        </Button>
      </div>
    </div>
  );
}

export default SettingsMenu;
