import { loadUser, saveUser } from '@/lib/user/userUtil';

export const extractUserData = (line) => {
  console.log('🔍 Extracting user data from line:', line);
  const updates = {};

  // Extract name (userName) - looks for "name [value]" after a dash
  const nameMatch = line.match(/(?<=-\sname\s)[^]+?(?=\s-)/);
  if (nameMatch) {
    updates.userName = nameMatch[0].trim();
    console.log('✅ Found userName:', updates.userName);
  } else {
    console.log('❌ No userName match found');
  }

  // Extract geid - looks for "geid [value]" after a dash
  const geidMatch = line.match(/(?<=-\sgeid\s)\d+(?=\s-)/);
  if (geidMatch) {
    updates.geid = geidMatch[0];
    console.log('✅ Found geid:', updates.geid);
  } else {
    console.log('❌ No geid match found');
  }

  console.log('📝 Extracted updates:', updates);
  return updates;
};

export const processNameAndID = async (line) => {
  console.log('🚀 processNameAndID called with line:', line);

  // Extract user data from the line
  const userUpdates = extractUserData(line);

  if (Object.keys(userUpdates).length > 0) {
    console.log('💾 Saving user updates:', userUpdates);
    // Load existing user data
    const existingUserData = await loadUser();

    // Merge with new data
    const updatedUserData = { ...existingUserData, ...userUpdates };

    // Save updated user data
    await saveUser(updatedUserData);
    console.log('✅ User data saved successfully');

    return updatedUserData;
  } else {
    console.log('⚠️ No user updates found, line may not contain expected format');
  }

  return null;
};

export const processStarCitizenVersion = async (line) => {
  const starCitizenVersion = line.match(/(?<=>\sBranch:\s).*/);
  if (starCitizenVersion) {
    const existingUserData = await loadUser();
    const updates = { starCitizenVersion: starCitizenVersion[0] };
    const updatedUserData = { ...existingUserData, ...updates };
    await saveUser(updatedUserData);
  } else {
    console.log('No star citizen version found in log file');
  }
};
