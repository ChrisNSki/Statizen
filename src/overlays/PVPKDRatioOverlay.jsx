import React from 'react';
import { useData } from '@/lib/context/data/dataContext';

const PVPKDRatioOverlay = () => {
  console.log('🔥 PVPKDRatioOverlay component is rendering!');

  const { PVPData } = useData();

  console.log('PVPKDRatioOverlay - PVPData:', PVPData);

  // Calculate K/D ratio (same logic as Dashboard)
  const pvpKDRatio = PVPData?.deaths === 0 ? PVPData?.kills : (PVPData?.kills / PVPData?.deaths).toFixed(2);

  return (
    <div className='overlay-panel backdrop-blur-md border rounded-lg px-4 py-3 text-white text-sm min-w-[200px] shadow-2xl transition-all duration-300'>
      <div className='overlay-title font-semibold mb-2 text-xs uppercase tracking-wider'>PVP K/D Ratio</div>
      <div className='text-xs leading-tight'>
        <div className='text-lg font-bold text-green-600'>{pvpKDRatio || '0.00'}</div>
        <div className='text-xs text-muted-foreground'>
          {PVPData?.kills || 0} kills / {PVPData?.deaths || 0} deaths
        </div>
      </div>
    </div>
  );
};

export default PVPKDRatioOverlay;
