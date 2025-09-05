import React from 'react';
import { useData } from '@/lib/context/data/dataContext';
import { Badge } from '@/components/ui/badge';
import { BadgePlus, PersonStanding, Skull, CircleOff } from 'lucide-react';

const NearbyPlayersOverlay = () => {
  const { nearbyPlayers } = useData();

  const nearbyPlayersList = () => {
    if (!nearbyPlayers || nearbyPlayers.length === 0) {
      return (
        <Badge variant='outline' className='bg-gray-700 text-white hover:bg-gray-600'>
          <CircleOff className='w-3 h-3 mr-1' />
          No players detected
        </Badge>
      );
    }

    return nearbyPlayers.map((player, index) => {
      let badgeStyle = 'bg-gray-700 text-white hover:bg-gray-600';
      if (player.icon === 'badge-plus') {
        badgeStyle = 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      } else if (player.icon === 'person-standing') {
        badgeStyle = 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50';
      }

      return (
        <Badge key={`${player.playerName}-${index}`} className={`${badgeStyle} text-xs`}>
          {player.icon === 'badge-plus' ? <BadgePlus className='w-3 h-3 mr-1' /> : player.icon === 'person-standing' ? <PersonStanding className='w-3 h-3 mr-1' /> : <Skull className='w-3 h-3 mr-1' />}
          {player.playerName}
        </Badge>
      );
    });
  };

  return (
    <div className='overlay-panel backdrop-blur-md border rounded-lg px-4 py-3 text-white text-sm min-w-[200px] shadow-2xl transition-all duration-300'>
      <div className='overlay-title font-semibold mb-2 text-xs uppercase tracking-wider'>Nearby Players</div>
      <div className='text-xs leading-tight'>
        <div className='flex flex-wrap gap-1 max-h-20 overflow-y-auto'>{nearbyPlayersList()}</div>
      </div>
    </div>
  );
};

export default NearbyPlayersOverlay;
