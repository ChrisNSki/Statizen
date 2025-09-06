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
  console.log('🎮 Overlay component rendering...');

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
    console.log('🎯 Initializing widgets - settings loaded:', !!settings?.overlayWidgets);
    return [];
  });

  // Sync local settings with context settings
  useEffect(() => {
    if (contextSettings) {
      setSettings(contextSettings);
    }
  }, [contextSettings]);

  // Grid snapping configuration
  const gridSize = 20; // 20px grid for snapping
  const snapToGrid = useMemo(() => createSnapModifier(gridSize), [gridSize]);

  // DnD sensors
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  // Update widgets when settings change
  useEffect(() => {
    console.log('🎯 Settings changed - overlayWidgets:', !!settings?.overlayWidgets, 'widgetVisibility:', settings?.widgetVisibility);

    if (settings?.overlayWidgets) {
      const filteredWidgets = settings.overlayWidgets
        .filter((widget) => {
          const isVisible = settings.widgetVisibility?.[widget.id] !== false;
          console.log(`🎯 Widget ${widget.id} visibility:`, isVisible, 'setting:', settings.widgetVisibility?.[widget.id]);
          return isVisible;
        })
        .map((widget) => ({
          ...widget,
          component: componentMap[widget.component],
        }));
      console.log(
        '🎯 Filtered widgets:',
        filteredWidgets.map((w) => w.id)
      );
      setWidgets(filteredWidgets);
    } else {
      // If no settings loaded yet, use fallback positions but don't save them
      console.log('🎯 No settings loaded yet, using fallback positions (not saved)');
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
        console.log('⚠️ Skipping widget position save - settings not loaded yet');
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
      console.log('✅ Widget positions saved to settings');
    } catch (error) {
      console.error('❌ Failed to save widget positions:', error);
    }
  }, [widgets, settings]);

  // Listen for settings updates from main window via Tauri events
  useEffect(() => {
    const setupEventListeners = async () => {
      try {
        const unlisten = await listen('settings-update', (event) => {
          console.log('🎨 Received settings update from main window:', event.payload);
          if (event.payload && event.payload.settings) {
            const updatedSettings = event.payload.settings;
            console.log('🎨 Updating overlay settings:', updatedSettings);

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
  useEffect(() => {
    console.log('🎨 Overlay color updated:', overlayColor);
  }, [overlayColor]);

  // Log when edit mode changes and notify main window
  useEffect(() => {
    console.log('🎮 Edit mode state changed:', isEditMode, 'Pointer events:', isEditMode ? 'auto' : 'none');

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
    console.log('🎯 Drag started:', event.active.id);
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

            console.log('🎯 Drag end - New position:', { newX, newY, delta });

            return { ...item, x: newX, y: newY };
          }
          return item;
        });
      });
    }
  };

  // No grid calculations needed - free positioning

  useEffect(() => {
    console.log('🎮 Overlay Window initialized');

    // Send a message to the main window to confirm overlay is loaded
    if (window.opener) {
      window.opener.postMessage('🎮 Overlay window loaded!', '*');
    }

    // Set initial passthrough state - start with passthrough enabled (edit mode disabled)
    const setInitialPassthrough = async () => {
      try {
        console.log('🔧 Setting initial passthrough state - passthrough enabled by default');
        await invoke('disable_overlay_interaction'); // Start with passthrough enabled
        console.log('✅ Initial passthrough set successfully');
      } catch (error) {
        console.error('❌ Failed to set initial passthrough state:', error);
      }
    };

    setInitialPassthrough();
  }, []);

  // Separate useEffect for the event listener to avoid stale closures
  useEffect(() => {
    if (listenerSetupRef.current) {
      console.log('🎮 Event listener already set up, skipping...');
      return;
    }

    console.log('🎮 Setting up edit mode listener...');
    listenerSetupRef.current = true;

    let unlistenEditMode = () => {};

    // Listen for edit mode toggle from main window via Tauri events
    const setupEditModeListener = async () => {
      try {
        console.log('🎮 Creating toggle-edit-mode listener');
        const unlisten = await listen('toggle-edit-mode', (event) => {
          console.log('🎮 Received edit mode toggle from main window:', event);

          // Prevent rapid toggling
          if (toggleInProgressRef.current) {
            console.log('🎮 Toggle already in progress, ignoring...');
            return;
          }

          const newEditMode = !isEditModeRef.current;
          console.log('🎮 Current edit mode:', isEditModeRef.current, '-> New edit mode:', newEditMode);

          toggleInProgressRef.current = true;
          toggleConfigModeRef.current(newEditMode);

          // Reset the flag after a delay
          setTimeout(() => {
            toggleInProgressRef.current = false;
            console.log('🎮 Toggle flag reset');
          }, 200);
        });

        console.log('🎮 Edit mode listener created successfully');
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
      console.log('🎮 Cleaning up edit mode listener');
      listenerSetupRef.current = false;
      unlistenEditMode();
    };
  }, []); // Empty dependency array - using ref to avoid infinite loop

  const toggleConfigModeRef = useRef();

  const toggleConfigMode = useCallback(
    (isConfig) => {
      console.log('🔧 Toggling config mode:', isConfig, 'Current state:', isEditModeRef.current);

      // Prevent duplicate toggles
      if (isEditModeRef.current === isConfig) {
        console.log('🔧 Already in requested state, skipping toggle');
        return;
      }

      isEditModeRef.current = isConfig;
      setIsEditMode(isConfig); // CRITICAL FIX: Update the state that controls pointerEvents!

      if (isConfig) {
        if (configModeRef.current) configModeRef.current.classList.remove('hidden');
        if (overlayContainerRef.current) {
          overlayContainerRef.current.classList.add('border-2', 'border-dashed', 'border-white/50');
        }
        console.log('🔧 Edit mode enabled - widgets are now draggable');
      } else {
        if (configModeRef.current) configModeRef.current.classList.add('hidden');
        if (overlayContainerRef.current) {
          overlayContainerRef.current.classList.remove('border-2', 'border-dashed', 'border-white/50');
        }
        console.log('🎮 Edit mode disabled - widgets are locked in position');

        // Save widget positions when edit mode is disabled
        saveWidgetPositions();
      }

      // Toggle passthrough - when edit mode is enabled, disable passthrough (so we can interact)
      // When edit mode is disabled, enable passthrough (so clicks go through to the game)
      console.log('🔧 Setting passthrough to:', !isConfig, '(edit mode:', isConfig, ')');

      // Add a small delay to ensure the window is fully initialized
      setTimeout(() => {
        if (isConfig) {
          // Enable edit mode - disable passthrough and enable interaction
          console.log('🔧 JavaScript: Enabling edit mode - calling enable_overlay_interaction');
          invoke('enable_overlay_interaction')
            .then(() => {
              console.log('✅ Overlay interaction enabled');
              // Force focus the window
              window.focus();
              console.log('🎯 Window focused');
            })
            .catch((error) => console.error('❌ Failed to enable overlay interaction:', error));
        } else {
          // Disable edit mode - enable passthrough
          console.log('🔧 JavaScript: Disabling edit mode - calling disable_overlay_interaction');
          invoke('disable_overlay_interaction')
            .then(() => console.log('✅ Overlay interaction disabled'))
            .catch((error) => console.error('❌ Failed to disable overlay interaction:', error));
        }
      }, 100);
    },
    [saveWidgetPositions]
  );

  // Store the function in a ref so it can be used in the event listener
  toggleConfigModeRef.current = toggleConfigMode;

  // Handle disable edit mode button click
  const handleDisableEditMode = useCallback(() => {
    console.log('🎮 Disable edit mode button clicked');
    toggleConfigMode(false);
  }, [toggleConfigMode]);

  console.log('🎮 Overlay component returning JSX...');

  // Add click detection for debugging
  const handleOverlayClick = (e) => {
    console.log('🖱️ Overlay clicked!', e.type, e.target, 'Edit mode:', isEditMode);
    e.stopPropagation();
  };

  // Handle context menu for debugging
  const handleContextMenu = (e) => {
    console.log('🖱️ Right-click detected!', e.target, 'Edit mode:', isEditMode);
    // Allow context menu for debugging
    e.preventDefault();
    e.stopPropagation();
  };

  // Add mouse move detection
  const handleMouseMove = (e) => {
    if (isEditMode) {
      console.log('🖱️ Mouse move detected!', e.clientX, e.clientY);
    }
  };

  return (
    <OverlayTheme overlayColor={overlayColor}>
      <div
        className={`fixed inset-0 w-screen h-screen font-sans ${isEditMode ? 'bg-black/20' : 'bg-transparent'}`}
        ref={rootRef}
        style={{ pointerEvents: isEditMode ? 'auto' : 'none' }}
        onClick={handleOverlayClick}
        onContextMenu={handleContextMenu}
        onMouseMove={handleMouseMove}
      >
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
