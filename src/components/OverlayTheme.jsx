import React from 'react';

const OverlayTheme = ({ children, overlayColor = '#4A8FD460' }) => {
  // Convert hex with alpha to CSS rgba
  const hexToRgba = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const a = parseInt(hex.slice(7, 9), 16) / 255;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  };

  // Generate CSS custom properties for overlay colors
  const generateOverlayColors = (baseColor) => {
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    const a = parseInt(baseColor.slice(7, 9), 16) / 255;

    // Base overlay color
    const baseOverlay = `rgba(${r}, ${g}, ${b}, ${a})`;

    // Light overlay (20% lighter)
    const lightR = Math.min(255, Math.round(r + (255 - r) * 0.2));
    const lightG = Math.min(255, Math.round(g + (255 - g) * 0.2));
    const lightB = Math.min(255, Math.round(b + (255 - b) * 0.2));
    const lightOverlay = `rgba(${lightR}, ${lightG}, ${lightB}, ${a})`;

    // Background overlay (20% darker)
    const darkR = Math.max(0, Math.round(r * 0.8));
    const darkG = Math.max(0, Math.round(g * 0.8));
    const darkB = Math.max(0, Math.round(b * 0.8));
    const bgOverlay = `rgba(${darkR}, ${darkG}, ${darkB}, ${a})`;

    // Background text (40% lighter)
    const textR = Math.min(255, Math.round(r + (255 - r) * 0.4));
    const textG = Math.min(255, Math.round(g + (255 - g) * 0.4));
    const textB = Math.min(255, Math.round(b + (255 - b) * 0.4));
    const bgText = `rgba(${textR}, ${textG}, ${textB}, ${a})`;

    return {
      '--base-overlay-color': baseOverlay,
      '--light-overlay-color': lightOverlay,
      '--bg-overlay-color': bgOverlay,
      '--bg-overlay-text-color': bgText,
    };
  };

  return (
    <>
      <style>{`
        body { background: transparent !important; }
        html { background: transparent !important; }
        #root { background: transparent !important; }
        
        .overlay-panel {
          border-color: var(--base-overlay-color) !important;
          background: var(--bg-overlay-color) !important;
        }
        
        .overlay-panel:hover {
          border-color: var(--light-overlay-color) !important;
        }
        
        .overlay-title {
          color: var(--bg-overlay-text) !important;
        }
      `}</style>
      <div
        className='overlay-root'
        style={{
          backgroundColor: 'transparent',
          ...generateOverlayColors(overlayColor),
        }}
      >
        {children}
      </div>
    </>
  );
};

export default OverlayTheme;
