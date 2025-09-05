import React from 'react';
import { useData } from '@/lib/context/data/dataContext';

const PVEKDRatioOverlay = () => {
  const { PVEData } = useData();

  // Calculate K/D ratio (same logic as Dashboard)
  const pveKDRatio = PVEData?.deaths === 0 ? PVEData?.kills : (PVEData?.kills / PVEData?.deaths).toFixed(2);

  return (
    <div className='overlay-panel backdrop-blur-md border rounded-lg px-4 py-3 text-white text-sm min-w-[200px] shadow-2xl transition-all duration-300'>
      <div className='overlay-title font-semibold mb-2 text-xs uppercase tracking-wider'>PVE K/D Ratio</div>
      <div className='text-xs leading-tight'>
        <div className='text-lg font-bold text-orange-600'>{pveKDRatio || '0.00'}</div>
        <div className='text-xs text-muted-foreground'>
          {PVEData?.kills || 0} kills / {PVEData?.deaths || 0} deaths
        </div>
      </div>
    </div>
  );
};

export default PVEKDRatioOverlay;
