import { loadUser } from '../../lib/user/userUtil.js';
import { loadPVE, savePVE, addPVELogEntry } from '../../lib/pve/pveUtil.js';
import { queueKDUpdate } from '../../lib/utils.js';
import { reportCrash } from '../../lib/discord/discordUtil.js';

// Debug flag - set to false to disable console logging
const consoleDebugging = false;

export async function crashEvent(line) {
  consoleDebugging && console.log('🔍 Processing crashEvent line:', line);
  
  try {
    let userData = await loadUser();
    const userName = userData.userName;
    const pveData = await loadPVE();
    
    consoleDebugging && console.log('👤 Current user:', userName);

    // === Fatal Collision Detection ===
    if (line.includes('<FatalCollision>')) {
      consoleDebugging && console.log('💥 FATAL COLLISION DETECTED!');
      
      // Extract vehicle information
      const vehicleMatch = line.match(/vehicle ([^\s]+)/);
      const vehicleName = vehicleMatch ? vehicleMatch[1] : 'Unknown Vehicle';
      
      consoleDebugging && console.log('🚗 Vehicle involved:', vehicleName);
      
      // Log the crash event
      addPVELogEntry('crash', 'loss', vehicleName);
      
      await queueKDUpdate(async () => {
        const updatedPVE = { ...pveData };
        updatedPVE.deaths += 1;
        updatedPVE.currentMonth.deaths += 1;
        await savePVE(updatedPVE);
      });
      
      // Send Discord notification for crash
      await reportCrash(vehicleName);
      return;
    }

    // === Vehicle Destruction Detection ===
    if (line.includes('<Vehicle Destruction>')) {
      consoleDebugging && console.log('💥 VEHICLE DESTRUCTION DETECTED!');
      
      // Extract vehicle information
      const vehicleMatch = line.match(/Vehicle '([^']+)'/);
      const vehicleName = vehicleMatch ? vehicleMatch[1] : 'Unknown Vehicle';
      
      consoleDebugging && console.log('🚗 Vehicle destroyed:', vehicleName);
      
      // Extract cause information
      const causeMatch = line.match(/caused by '([^']+)'/);
      const cause = causeMatch ? causeMatch[1] : 'Unknown';
      
      consoleDebugging && console.log('🔍 Destruction cause:', cause);
      
      // Only log if it was caused by the current user
      if (cause === userName) {
        consoleDebugging && console.log('✅ Vehicle destruction caused by current user');
        
        // Log the vehicle destruction event
        addPVELogEntry('vehicle_destruction', 'loss', vehicleName);
        
        // Note: We don't increment death count here since it's already handled by the Actor Death event
        // This is just for tracking vehicle destruction separately
      }
      
      return;
    }

  } catch (error) {
    console.error('Error processing crash event:', error);
    return null;
  }
} 