import React from 'react';
import { useData } from '@/lib/context/data/dataContext';
import { formatTimeAgo } from '@/lib/utils';

const LastKilledByOverlay = () => {
  const { lastKilledBy } = useData();

  return (
    <div className='overlay-panel backdrop-blur-md border rounded-lg px-4 py-3 text-white text-sm min-w-[200px] shadow-2xl transition-all duration-300'>
      <div className='overlay-title font-semibold mb-2 text-xs uppercase tracking-wider'>Last Killed By</div>
      <div className='text-xs leading-tight'>
        <div className='flex items-center gap-2'>
          <span className='inline-block w-2 h-2 rounded-full bg-red-500'></span>
          <div>
            <div className='font-medium'>{lastKilledBy?.actorName || 'No one yet!'}</div>
            <div className='text-xs text-red-400'>{formatTimeAgo(lastKilledBy?.time)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LastKilledByOverlay;
