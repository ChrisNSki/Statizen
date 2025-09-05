import React from 'react';
import { useData } from '@/lib/context/data/dataContext';

const LogLinesProcessedOverlay = () => {
  const { logInfo } = useData();

  return (
    <div className='overlay-panel backdrop-blur-md border rounded-lg px-4 py-3 text-white text-sm min-w-[200px] shadow-2xl transition-all duration-300'>
      <div className='overlay-title font-semibold mb-2 text-xs uppercase tracking-wider'>Log Lines Processed</div>
      <div className='text-xs leading-tight'>
        <span className='inline-block w-2 h-2 rounded-full mr-1.5 bg-orange-500'></span>
        {logInfo?.lastProcessedLine || 0}
      </div>
    </div>
  );
};

export default LogLinesProcessedOverlay;
