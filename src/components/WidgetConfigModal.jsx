import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings, X } from 'lucide-react';

const WidgetConfigModal = ({ isOpen, onClose, settings, updateSettings }) => {
  const widgetConfigs = [
    { id: 'status', name: 'Status', description: 'Current ship and status information' },
    { id: 'pvp-kd', name: 'PVP K/D Ratio', description: 'Player vs Player kill/death ratio' },
    { id: 'pve-kd', name: 'PVE K/D Ratio', description: 'Player vs Environment kill/death ratio' },
    { id: 'log-lines', name: 'Log Lines Processed', description: 'Number of log lines processed' },
    { id: 'nearby', name: 'Nearby Players', description: 'List of detected nearby players' },
    { id: 'last-killed-by', name: 'Last Killed By', description: 'Last entity that killed you' },
    { id: 'last-killed', name: 'Last Killed', description: 'Last entity you killed' },
    { id: 'xp-bar', name: 'XP Progress Bar', description: 'Experience progress with rank/prestige' },
  ];

  const handleWidgetToggle = (widgetId, enabled) => {
    const updatedVisibility = {
      ...settings.widgetVisibility,
      [widgetId]: enabled,
    };
    updateSettings('widgetVisibility', updatedVisibility);
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* Backdrop */}
      <div className='fixed inset-0 bg-black/50' onClick={onClose} />

      {/* Dialog */}
      <div className='relative bg-background border rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b'>
          <div className='flex items-center gap-2'>
            <Settings className='w-5 h-5' />
            <h2 className='text-lg font-semibold'>Widget Configuration</h2>
          </div>
          <Button variant='ghost' size='sm' onClick={onClose} className='h-8 w-8 p-0'>
            <X className='w-4 h-4' />
          </Button>
        </div>

        {/* Content */}
        <div className='p-6 space-y-6 overflow-y-auto max-h-[60vh]'>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <Settings className='w-4 h-4' />
            <span>Configure which widgets are visible in the overlay</span>
          </div>

          <div className='space-y-4'>
            {widgetConfigs.map((widget) => (
              <div key={widget.id} className='flex items-center justify-between p-3 border rounded-lg'>
                <div className='flex-1'>
                  <div className='font-medium'>{widget.name}</div>
                  <div className='text-sm text-muted-foreground'>{widget.description}</div>
                </div>
                <div className='flex items-center space-x-2'>
                  <Switch id={`widget-${widget.id}`} checked={settings.widgetVisibility?.[widget.id] ?? true} onCheckedChange={(enabled) => handleWidgetToggle(widget.id, enabled)} />
                  <Label htmlFor={`widget-${widget.id}`} className='text-sm'>
                    {settings.widgetVisibility?.[widget.id] ? 'Visible' : 'Hidden'}
                  </Label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className='flex justify-end gap-2 p-6 border-t bg-muted/50'>
          <Button variant='outline' onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WidgetConfigModal;
