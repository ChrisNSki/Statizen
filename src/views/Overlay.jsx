import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useSettings } from '@/lib/context/settings/settingsContext';
import { saveSettings } from '@/lib/settings/settingsUtil';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay, useDraggable } from '@dnd-kit/core';
import { createSnapModifier } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import OverlayTheme from '@/components/OverlayTheme';
import { StatusOverlay, PVPKDRatioOverlay, PVEKDRatioOverlay, LogLinesProcessedOverlay, NearbyPlayersOverlay, LastKilledByOverlay, LastKilledOverlay, XPBarOverlay } from '@/overlays';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

// Component mapping for settings
const componentMap = {
  StatusOverlay,
  PVPKDRatioOverlay,
  PVEKDRatioOverlay,
  LogLinesProcessedOverlay,
  NearbyPlayersOverlay,
  LastKilledByOverlay,
  LastKilledOverlay,
  XPBarOverlay,
};

// Draggable wrapper component for overlay widgets
const DraggableWidget = ({ id, children, isEditMode, x, y, w, h }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
    disabled: !isEditMode,
  });

  const style = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${w}px`,
    height: `${h}px`,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...(isEditMode ? listeners : {})} className={`${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''}`}>
      {children}
    </div>
  );
};

const Overlay = () => {
  const rootRef = useRef(null);
  const configModeRef = useRef(null);
  const overlayContainerRef = useRef(null);
  const { settings: contextSettings } = useSettings();
  const [settings, setSettings] = useState(contextSettings);
  const [overlayColor, setOverlayColor] = useState(settings?.overlayColor || '#4A8FD460');
  const [isEditMode, setIsEditMode] = useState(false);
  const isEditModeRef = useRef(false);
  const listenerSetupRef = useRef(false);
  const toggleInProgressRef = useRef(false);
  const [activeId, setActiveId] = useState(null);

  // Widget positions from settings
  const [widgets, setWidgets] = useState(() => {
    // Start with empty array - will be populated when settings load
    return [];
  });

  // Sync local settings with context settings
  useEffect(() => {
    if (contextSettings) {
      setSettings(contextSettings);
    }
  }, [contextSettings]);

  // Grid snapping configuration
  const gridSize = 20;
  const snapToGrid = useMemo(() => createSnapModifier(gridSize), [gridSize]);

  // DnD sensors
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  // Update widgets when settings change
  useEffect(() => {
    if (settings?.overlayWidgets) {
      const filteredWidgets = settings.overlayWidgets
        .filter((widget) => {
          const isVisible = settings.widgetVisibility?.[widget.id] !== false;
          return isVisible;
        })
        .map((widget) => ({
          ...widget,
          component: componentMap[widget.component],
        }));
      setWidgets(filteredWidgets);
    } else {
      // If no settings loaded yet, use fallback positions but don't save them
      const fallbackWidgets = [
        { id: 'status', component: StatusOverlay, x: 20, y: 20, w: 240, h: 180 },
        { id: 'pvp-kd', component: PVPKDRatioOverlay, x: 280, y: 20, w: 240, h: 180 },
        { id: 'pve-kd', component: PVEKDRatioOverlay, x: 540, y: 20, w: 240, h: 180 },
        { id: 'log-lines', component: LogLinesProcessedOverlay, x: 800, y: 20, w: 180, h: 180 },
        { id: 'nearby', component: NearbyPlayersOverlay, x: 20, y: 220, w: 240, h: 180 },
        { id: 'last-killed-by', component: LastKilledByOverlay, x: 280, y: 220, w: 240, h: 180 },
        { id: 'last-killed', component: LastKilledOverlay, x: 540, y: 220, w: 240, h: 180 },
        { id: 'xp-bar', component: XPBarOverlay, x: 800, y: 220, w: 180, h: 180 },
      ];
      setWidgets(fallbackWidgets);
    }
  }, [settings?.overlayWidgets, settings?.widgetVisibility]);

  // Save widget positions to settings
  const saveWidgetPositions = useCallback(async () => {
    try {
      // Only save if we have valid settings loaded
      if (!settings || !settings.overlayWidgets) {
        return;
      }

      const widgetPositions = widgets.map((widget) => {
        // Find the component name by looking up the component in the componentMap
        const componentName = Object.keys(componentMap).find((key) => componentMap[key] === widget.component) || 'Unknown';

        return {
          id: widget.id,
          component: componentName,
          x: widget.x,
          y: widget.y,
          w: widget.w,
          h: widget.h,
        };
      });

      const updatedSettings = {
        ...settings,
        overlayWidgets: widgetPositions,
      };

      await saveSettings(updatedSettings);
    } catch (error) {
      console.error('❌ Failed to save widget positions:', error);
    }
  }, [widgets, settings]);

  // Listen for settings updates from main window via Tauri events
  useEffect(() => {
    const setupEventListeners = async () => {
      try {
        const unlisten = await listen('settings-update', (event) => {
          if (event.payload && event.payload.settings) {
            const updatedSettings = event.payload.settings;

            // Update overlay color if it changed
            if (updatedSettings.overlayColor) {
              setOverlayColor(updatedSettings.overlayColor);
            }

            // Update the full settings object to trigger widget filtering
            // This will cause the useEffect with settings dependency to run
            setSettings(updatedSettings);
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
  useEffect(() => {}, [overlayColor]);

  // Log when edit mode changes and notify main window
  useEffect(() => {
    // Notify main window of edit mode state change
    invoke('broadcast_to_main', {
      message: {
        isEditMode: isEditMode,
      },
    }).catch((error) => {
      console.error('❌ Failed to notify main window of edit mode state:', error);
    });
  }, [isEditMode]);

  // Handle drag start
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, delta } = event;
    setActiveId(null);

    if (delta) {
      // Update the widget position based on the drag delta
      setWidgets((items) => {
        return items.map((item) => {
          if (item.id === active.id) {
            const newX = Math.max(0, item.x + delta.x);
            const newY = Math.max(0, item.y + delta.y);

            return { ...item, x: newX, y: newY };
          }
          return item;
        });
      });
    }
  };

  // No grid calculations needed - free positioning

  useEffect(() => {
    // Send a message to the main window to confirm overlay is loaded
    if (window.opener) {
      window.opener.postMessage('🎮 Overlay window loaded!', '*');
    }

    // Set initial passthrough state - start with passthrough enabled (edit mode disabled)
    const setInitialPassthrough = async () => {
      try {
        await invoke('disable_overlay_interaction'); // Start with passthrough enabled
      } catch (error) {
        console.error('❌ Failed to set initial passthrough state:', error);
      }
    };

    setInitialPassthrough();
  }, []);

  // Separate useEffect for the event listener to avoid stale closures
  useEffect(() => {
    if (listenerSetupRef.current) {
      return;
    }

    listenerSetupRef.current = true;

    let unlistenEditMode = () => {};

    // Listen for edit mode toggle from main window via Tauri events
    const setupEditModeListener = async () => {
      try {
        const unlisten = await listen('toggle-edit-mode', () => {
          // Prevent rapid toggling
          if (toggleInProgressRef.current) {
            return;
          }

          const newEditMode = !isEditModeRef.current;

          toggleInProgressRef.current = true;
          toggleConfigModeRef.current(newEditMode);

          // Reset the flag after a delay
          setTimeout(() => {
            toggleInProgressRef.current = false;
          }, 200);
        });

        return unlisten;
      } catch (error) {
        console.error('Failed to setup edit mode listener:', error);
        return () => {};
      }
    };

    setupEditModeListener().then((cleanup) => {
      unlistenEditMode = cleanup;
    });

    return () => {
      listenerSetupRef.current = false;
      unlistenEditMode();
    };
  }, []); // Empty dependency array - using ref to avoid infinite loop

  const toggleConfigModeRef = useRef();

  const toggleConfigMode = useCallback(
    (isConfig) => {
      // Prevent duplicate toggles
      if (isEditModeRef.current === isConfig) {
        return;
      }

      isEditModeRef.current = isConfig;
      setIsEditMode(isConfig); // CRITICAL FIX: Update the state that controls pointerEvents!

      if (isConfig) {
        if (configModeRef.current) configModeRef.current.classList.remove('hidden');
        if (overlayContainerRef.current) {
          overlayContainerRef.current.classList.add('border-2', 'border-dashed', 'border-white/50');
        }
      } else {
        if (configModeRef.current) configModeRef.current.classList.add('hidden');
        if (overlayContainerRef.current) {
          overlayContainerRef.current.classList.remove('border-2', 'border-dashed', 'border-white/50');
        }

        // Save widget positions when edit mode is disabled
        saveWidgetPositions();
      }

      // Add a small delay to ensure the window is fully initialized
      setTimeout(() => {
        if (isConfig) {
          // Enable edit mode - disable passthrough and enable interaction
          invoke('enable_overlay_interaction')
            .then(() => {
              // Force focus the window
              window.focus();
            })
            .catch((error) => console.error('❌ Failed to enable overlay interaction:', error));
        } else {
          // Disable edit mode - enable passthrough
          invoke('disable_overlay_interaction')
            .then(() => {})
            .catch((error) => console.error('❌ Failed to disable overlay interaction:', error));
        }
      }, 100);
    },
    [saveWidgetPositions]
  );

  toggleConfigModeRef.current = toggleConfigMode;

  const handleDisableEditMode = useCallback(() => {
    toggleConfigMode(false);
  }, [toggleConfigMode]);

  const handleOverlayClick = (e) => {
    e.stopPropagation();
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <OverlayTheme overlayColor={overlayColor}>
      <div className={`fixed inset-0 w-screen h-screen font-sans ${isEditMode ? 'bg-black/20' : 'bg-transparent'}`} ref={rootRef} style={{ pointerEvents: isEditMode ? 'auto' : 'none' }} onClick={handleOverlayClick} onContextMenu={handleContextMenu}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} modifiers={[snapToGrid]}>
          {/* No grid background needed for free positioning */}

          {/* Widget Container */}
          <div className='fixed inset-0 z-[1000]' ref={overlayContainerRef} style={{ width: '100vw', height: '100vh' }}>
            {widgets.map((widget) => {
              const Component = widget.component;
              return (
                <DraggableWidget key={widget.id} id={widget.id} isEditMode={isEditMode} x={widget.x} y={widget.y} w={widget.w} h={widget.h}>
                  <Component />
                </DraggableWidget>
              );
            })}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeId ? (
              <div className='opacity-50'>
                {(() => {
                  const widget = widgets.find((w) => w.id === activeId);
                  if (widget) {
                    const Component = widget.component;
                    return <Component />;
                  }
                  return null;
                })()}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <div
          className='fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white p-5 rounded-xl border-2 border-dashed text-center pointer-events-auto z-[2000] hidden'
          style={{
            backgroundColor: 'var(--bg-overlay)',
            borderColor: 'var(--base-overlay)',
          }}
          ref={configModeRef}
        >
          <h3 className='overlay-title mb-2.5'>Overlay Edit Mode</h3>
          <p className='text-sm opacity-80'>Drag widgets to reposition them</p>
          <p className='text-sm opacity-80'>Widgets are now draggable!</p>
          <div className='mt-4 flex justify-center'>
            <Button onClick={handleDisableEditMode} className='flex justify-center items-center gap-2 bg-white hover:bg-gray-300 text-black border-0' size='sm'>
              <Check className='w-4 h-4' />
              Save Configuration
            </Button>
          </div>
        </div>
      </div>
    </OverlayTheme>
  );
};

export default Overlay;
