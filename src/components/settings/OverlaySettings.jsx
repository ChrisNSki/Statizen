import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { InfoIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMonitorsWithFallback, findMonitorById, getMonitorDisplayName } from '@/lib/monitor/monitorUtil';
// Removed shadcn ColorPicker - using native HTML color input instead

function OverlaySettings({ settings, updateSettings }) {
  const [monitors, setMonitors] = useState([]);
  const [loadingMonitors, setLoadingMonitors] = useState(true);

  // Load monitors on component mount with hot-plug detection
  useEffect(() => {
    const loadMonitors = async () => {
      try {
        setLoadingMonitors(true);
        const { monitors: detectedMonitors, selectedMonitor, needsUpdate } = await getMonitorsWithFallback(settings.targetMonitor);
        setMonitors(detectedMonitors);
        console.log('🖥️ Loaded monitors:', detectedMonitors);

        // Update settings if monitor changed due to hot-plug
        if (needsUpdate && selectedMonitor) {
          console.log('🔄 Monitor changed due to hot-plug, updating settings');
          updateSettings('targetMonitor', selectedMonitor);
        }
      } catch (error) {
        console.error('❌ Failed to load monitors:', error);
        setMonitors([]);
      } finally {
        setLoadingMonitors(false);
      }
    };

    loadMonitors();
  }, [settings.targetMonitor, updateSettings]);

  // Get current monitor info
  const currentMonitor = settings.targetMonitor ? findMonitorById(monitors, settings.targetMonitor.id) : null;
  // Helper function to extract RGB and alpha from hex with alpha
  const parseHexWithAlpha = (hexWithAlpha) => {
    if (!hexWithAlpha || typeof hexWithAlpha !== 'string') {
      return { rgb: '#4A8FD4', alpha: 0.6 };
    }

    // If it's 8-digit hex, extract RGB and alpha
    if (hexWithAlpha.match(/^#[0-9A-Fa-f]{8}$/)) {
      const rgb = hexWithAlpha.substring(0, 7);
      const alphaHex = hexWithAlpha.substring(7, 9);
      const alpha = parseInt(alphaHex, 16) / 255;
      return { rgb, alpha };
    }

    // If it's 6-digit hex, return with default alpha
    if (hexWithAlpha.match(/^#[0-9A-Fa-f]{6}$/)) {
      return { rgb: hexWithAlpha, alpha: 0.6 };
    }

    return { rgb: '#4A8FD4', alpha: 0.6 };
  };

  // Helper function to convert RGB hex and alpha to hex with alpha
  const rgbAndAlphaToHexWithAlpha = (rgbHex, alpha) => {
    if (!rgbHex || typeof rgbHex !== 'string') return '#4A8FD460';

    // Ensure it's a valid 6-digit hex
    const match = rgbHex.match(/^#([0-9A-Fa-f]{6})$/);
    if (!match) return '#4A8FD460';

    const alphaHex = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, '0');
    return `${rgbHex}${alphaHex}`;
  };

  // Parse current color
  const { rgb: colorForInput, alpha: currentAlpha } = parseHexWithAlpha(settings.overlayColor);

  // Handle color change from the HTML color input
  const handleColorChange = (event) => {
    const rgbHex = event.target.value;
    const hexWithAlpha = rgbAndAlphaToHexWithAlpha(rgbHex, currentAlpha);

    console.log('🎨 Color changed:', rgbHex, '->', hexWithAlpha);
    updateSettings('overlayColor', hexWithAlpha);
  };

  // Handle opacity change from the slider
  const handleOpacityChange = (event) => {
    const alpha = parseFloat(event.target.value);
    const hexWithAlpha = rgbAndAlphaToHexWithAlpha(colorForInput, alpha);

    console.log('🎨 Opacity changed:', alpha, '->', hexWithAlpha);
    updateSettings('overlayColor', hexWithAlpha);
  };

  // Handle monitor selection
  const handleMonitorChange = (monitorId) => {
    const selectedMonitor = findMonitorById(monitors, parseInt(monitorId));
    if (selectedMonitor) {
      console.log('🖥️ Monitor selected:', selectedMonitor);
      updateSettings('targetMonitor', selectedMonitor);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='space-y-4'>
        <div>
          <h3 className='text-lg font-semibold'>Overlay Settings</h3>
          <p className='text-sm text-muted-foreground'>Customize how the game overlay is displayed</p>
        </div>
        <Card>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='font-medium'>Show Overlay</p>
                <p className='text-sm text-muted-foreground'>Display game information overlay</p>
              </div>
              <Switch checked={settings.showOverlay || false} onCheckedChange={(val) => updateSettings('showOverlay', val)} />
            </div>

            <div className='flex flex-col items-center justify-between w-full gap-2'>
              <div className='flex flex-col w-full'>
                <div className='font-medium'>Target Monitor</div>
                <div className='text-sm text-muted-foreground'>Select the monitor to display the overlay on</div>
                {currentMonitor && (
                  <div className='text-xs text-muted-foreground mt-1'>
                    Selected: {currentMonitor.name} ({currentMonitor.width}x{currentMonitor.height})
                  </div>
                )}
              </div>
              <Select value={currentMonitor ? String(currentMonitor.id) : undefined} onValueChange={handleMonitorChange} disabled={loadingMonitors || monitors.length === 0}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder={loadingMonitors ? 'Loading monitors...' : monitors.length === 0 ? 'No monitors detected' : 'Select Monitor'} />
                </SelectTrigger>

                {/* Only render items when we actually have monitors */}
                {monitors.length > 0 && (
                  <SelectContent>
                    {monitors.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {getMonitorDisplayName(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                )}
              </Select>

              {/* Optional helper text when none */}
              {!loadingMonitors && monitors.length === 0 && <div className='text-sm text-destructive mt-2'>⚠️ Could not detect monitors. Check display settings and try again.</div>}
            </div>

            <div className='flex items-center justify-between w-full'>
              <div className='w-full'>
                <p className='font-medium pb-4'>Overlay Color</p>
                <div className='space-y-4'>
                  <div className='flex items-center gap-4'>
                    <div className='flex min-w-10 min-h-10 ml-2 rounded-full items-center justify-center border border-input outline-1 relative'>
                      <input type='color' value={colorForInput} onChange={handleColorChange} className='opacity-0 absolute inset-0 w-full h-full cursor-pointer caret-transparent' />
                      <div className='min-w-6 min-h-6 rounded-full border border-gray-400 caret-transparent' style={{ backgroundColor: colorForInput }}></div>
                    </div>
                    <div className='flex-1'>
                      <p className='text-sm text-muted-foreground'>Selected: {colorForInput}</p>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <label htmlFor='opacity-slider' className='text-sm font-medium'>
                        Opacity
                      </label>
                      <span className='text-sm text-muted-foreground'>{Math.round(currentAlpha * 100)}%</span>
                    </div>
                    <input
                      id='opacity-slider'
                      type='range'
                      min='0'
                      max='1'
                      step='0.01'
                      value={currentAlpha}
                      onChange={handleOpacityChange}
                      className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider'
                      style={{
                        background: `linear-gradient(to right, ${colorForInput}00 0%, ${colorForInput}FF 100%)`,
                      }}
                    />
                  </div>

                  <div className='flex w-full items-center gap-2 justify-center'>
                    <div className='w-8 h-8 rounded border border-input' style={{ backgroundColor: colorForInput }} />
                    <div
                      className='w-8 h-8 rounded border border-input'
                      style={{
                        backgroundColor: colorForInput,
                        opacity: currentAlpha,
                      }}
                    />
                    <span className='text-sm text-muted-foreground'>Solid vs {Math.round(currentAlpha * 100)}% opacity</span>
                  </div>
                </div>
              </div>
            </div>

            <div className='flex flex-row gap-1 items-center pt-2'>
              <InfoIcon className='w-3 h-3' />
              <span className='text-xs text-muted-foreground'>Game must be set to borderless window mode for the overlay to work.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default OverlaySettings;
