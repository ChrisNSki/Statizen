import React, { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useSettings } from '@/lib/context/settings/settingsContext';
import OverlayTheme from '@/components/OverlayTheme';
import { StatusOverlay, PVPKDRatioOverlay, PVEKDRatioOverlay, LogLinesProcessedOverlay, NearbyPlayersOverlay, LastKilledByOverlay, LastKilledOverlay, XPBarOverlay } from '@/overlays';

const Overlay = () => {
  console.log('🎮 Overlay component rendering...');

  const rootRef = useRef(null);
  const configModeRef = useRef(null);
  const overlayContainerRef = useRef(null);
  const configRef = useRef(false);
  const { settings } = useSettings();
  const [overlayColor, setOverlayColor] = useState(settings?.overlayColor || '#4A8FD460');

  // Listen for settings updates from main window via Tauri events
  useEffect(() => {
    const setupEventListeners = async () => {
      try {
        const unlisten = await listen('settings-update', (event) => {
          console.log('🎨 Received settings update from main window:', event.payload);
          if (event.payload && event.payload.settings && event.payload.settings.overlayColor) {
            setOverlayColor(event.payload.settings.overlayColor);
          }
        });

        return unlisten;
      } catch (error) {
        console.error('Failed to setup settings update listener:', error);
        return () => {};
      }
    };

    let unlisten = () => {};
    setupEventListeners().then((cleanup) => {
      unlisten = cleanup;
    });

    return () => {
      unlisten();
    };
  }, []);

  // Log when overlay color changes
  useEffect(() => {
    console.log('🎨 Overlay color updated:', overlayColor);
  }, [overlayColor]);

  useEffect(() => {
    console.log('🎮 Overlay Window initialized');

    // Send a message to the main window to confirm overlay is loaded
    if (window.opener) {
      window.opener.postMessage('🎮 Overlay window loaded!', '*');
    }

    // Set up configuration mode toggle
    const handleKeyDown = async (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'o') {
        configRef.current = !configRef.current;
        toggleConfigMode(configRef.current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Ensure default state (pass-through)
    if (rootRef.current) {
      rootRef.current.style.pointerEvents = 'none';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleConfigMode = (isConfig) => {
    if (isConfig) {
      if (configModeRef.current) configModeRef.current.classList.remove('hidden');
      if (rootRef.current) rootRef.current.style.pointerEvents = 'auto';
      if (overlayContainerRef.current) {
        overlayContainerRef.current.classList.add('border-2', 'border-dashed', 'border-white/50');
      }
      console.log('🔧 Configuration mode enabled');
    } else {
      if (configModeRef.current) configModeRef.current.classList.add('hidden');
      if (rootRef.current) rootRef.current.style.pointerEvents = 'none';
      if (overlayContainerRef.current) {
        overlayContainerRef.current.classList.remove('border-2', 'border-dashed', 'border-white/50');
      }
      console.log('🎮 Configuration mode disabled');
    }

    // Toggle passthrough
    invoke('set_passthrough', { pass: !isConfig }).catch(console.error);
  };

  console.log('🎮 Overlay component returning JSX...');

  return (
    <OverlayTheme overlayColor={overlayColor}>
      <div className='fixed inset-0 w-screen h-screen pointer-events-none font-sans bg-transparent' ref={rootRef}>
        <div className='absolute top-5 right-5 pointer-events-auto flex flex-col gap-2.5 z-[1000]' ref={overlayContainerRef}>
          {/* Overlay components go here - they can be drag-dropped and positioned */}
          <StatusOverlay />
          <PVPKDRatioOverlay />
          <PVEKDRatioOverlay />
          <LogLinesProcessedOverlay />
          <NearbyPlayersOverlay />
          <LastKilledByOverlay />
          <LastKilledOverlay />
          <XPBarOverlay />
        </div>

        <div
          className='fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white p-5 rounded-xl border-2 border-dashed text-center pointer-events-auto z-[2000] hidden'
          style={{
            backgroundColor: 'var(--bg-overlay)',
            borderColor: 'var(--base-overlay)',
          }}
          ref={configModeRef}
        >
          <h3 className='overlay-title mb-2.5'>Overlay Configuration Mode</h3>
          <p className='text-sm opacity-80'>Press Ctrl+Shift+O to toggle configuration mode</p>
          <p className='text-sm opacity-80'>Drag to reposition overlay elements</p>
        </div>
      </div>
    </OverlayTheme>
  );
};

export default Overlay;
