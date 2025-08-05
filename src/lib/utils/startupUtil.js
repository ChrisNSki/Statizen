import { invoke } from '@tauri-apps/api/core';

// Check if auto-startup is currently enabled
export async function isAutoStartupEnabled() {
    try {
        return await invoke('check_auto_startup');
    } catch (error) {
        console.error('Error checking auto-startup status:', error);
        return false;
    }
}

// Enable auto-startup using Task Scheduler (preferred method)
export async function enableAutoStartup() {
    try {
        const result = await invoke('enable_auto_startup');
        return { success: true, method: result };
    } catch (error) {
        if (error === 'task_scheduler_failed') {
            return { success: false, error: 'task_scheduler_failed', method: null };
        }
        console.error('Error enabling auto-startup:', error);
        return { success: false, error: error.message };
    }
}

// Disable auto-startup
export async function disableAutoStartup() {
    try {
        await invoke('disable_auto_startup');
        return { success: true };
    } catch (error) {
        console.error('Error disabling auto-startup:', error);
        return { success: false, error: error.message };
    }
}

// Alternative: Create startup folder shortcut (fallback method)
export async function createStartupShortcut() {
    try {
        const result = await invoke('create_startup_shortcut');
        return { success: true, method: result };
    } catch (error) {
        console.error('Error creating startup shortcut:', error);
        return { success: false, error: error.message };
    }
}

// Get available auto-startup methods
export async function getAvailableStartupMethods() {
    const methods = [];

    try {
        // Check if Task Scheduler is available
        const taskSchedulerAvailable = await invoke('check_task_scheduler_available');
        if (taskSchedulerAvailable) {
            methods.push({
                id: 'task_scheduler',
                name: 'Windows Task Scheduler',
                description: 'Most reliable method, requires admin privileges',
                recommended: true
            });
        }
    } catch (error) {
        console.error('Error checking Task Scheduler availability:', error);
    }

    try {
        // Check if startup folder is available
        const startupFolderAvailable = await invoke('check_startup_folder_available');
        if (startupFolderAvailable) {
            methods.push({
                id: 'startup_folder',
                name: 'Startup Folder',
                description: 'Simple method, works for most users',
                recommended: false
            });
        }
    } catch (error) {
        console.error('Error checking startup folder availability:', error);
    }

    return methods;
}

// Manual setup instructions for users
export function getManualSetupInstructions() {
    return {
        title: 'Manual Auto-Startup Setup',
        steps: [
            '1. Press Win + R to open Run dialog',
            '2. Type "shell:startup" and press Enter',
            '3. Copy Statizen.exe to the startup folder',
            '4. Or use Task Scheduler for more control'
        ],
        note: 'This method avoids registry edits that may trigger antivirus software.'
    };
}

