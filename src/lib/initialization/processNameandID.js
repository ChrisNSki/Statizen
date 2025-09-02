import { loadUser, saveUser } from '@/lib/user/userUtil';

export const extractUserData = (line) => {
  const updates = {};

  // Extract name (userName) - looks for "name [value]" after a dash
  const nameMatch = line.match(/(?<=-\sname\s)[^]+?(?=\s-)/);
  if (nameMatch) {
    updates.userName = nameMatch[0].trim();
  }

  // Extract geid - looks for "geid [value]" after a dash
  const geidMatch = line.match(/(?<=-\sgeid\s)\d+(?=\s-)/);
  if (geidMatch) {
    updates.geid = geidMatch[0];
  }

  return updates;
};

export const processNameAndID = async (line) => {
  // Extract user data from the line
  const userUpdates = extractUserData(line);

  if (Object.keys(userUpdates).length > 0) {
    // Load existing user data
    const existingUserData = await loadUser();

    // Merge with new data
    const updatedUserData = { ...existingUserData, ...userUpdates };

    // Save updated user data
    await saveUser(updatedUserData);

    return updatedUserData;
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
  }
};
