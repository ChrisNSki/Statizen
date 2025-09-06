import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const FactionSelector = ({ faction, onFactionChange }) => {
  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <Label htmlFor='faction'>Select Your Faction</Label>
        <Select value={faction} onValueChange={onFactionChange}>
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
      {/* <div className='space-y-3'>
        {faction === 'outlaw' ? (
          <div className='p-4 bg-gray-800 border border-red-500/20 rounded-lg'>
            <div className='flex items-center gap-2 mb-2'>
              <span className='text-2xl'>🏴</span>
              <h4 className='font-semibold text-red-400'>Outlaw Faction</h4>
            </div>
            <p className='text-sm text-red-300 italic mb-2'>"The stars belong to the bold."</p>
            <p className='text-sm text-gray-300 mb-3'>
              Drifters, smugglers, mercs, and pirates — the Outlaw faction is made up of those who live on the edge of society. They answer to no one, bending or breaking laws as needed to survive. Whether it's seizing cargo from corp convoys or
              taking bounties on corrupt enforcers, Outlaws carve their own path in the 'verse.
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
              Peacekeepers are defenders of the law and guardians of the UEE's vision for a safer, unified galaxy. From official Advocacy agents to corporate security and vigilante defenders, Peacekeepers uphold justice across lawless frontiers. They
              strike with precision, protect civilians, and push back against chaos.
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
      </div> */}
    </div>
  );
};

export default FactionSelector;
