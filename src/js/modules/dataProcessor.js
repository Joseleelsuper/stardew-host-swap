/**
 * Stardew Valley Host Swap Tool - Data Processor Module
 * Processes and manipulates data from save files
 * Enhanced based on comprehensive XML structure analysis
 */

import * as config from "./config.js";
import { isolateTag } from "./utils.js";

/**
 * Main function to fix host data with comprehensive transfers
 */
export function fixHostData(newHostData, originalHostData) {
  console.log("=== STARTING COMPREHENSIVE HOST DATA FIXES ===");
  let fixedData = newHostData;

  // Transfer critical mail
  fixedData = fixMail(fixedData, originalHostData);

  // Transfer critical events and flags
  fixedData = fixEvents(fixedData, originalHostData);

  // Transfer house upgrade levels
  fixedData = fixUpgradeLevels(fixedData, originalHostData);

  // Set proper home location for new host
  fixedData = fixHomeLocation(fixedData, "<homeLocation>FarmHouse</homeLocation>");

  // Transfer important progress flags
  fixedData = transferProgressFlags(fixedData, originalHostData);

  // Transfer sleep location
  fixedData = fixSleepLocation(fixedData, originalHostData);

  console.log("=== HOST DATA FIXES COMPLETED ===");
  return fixedData;
}

/**
 * Enhanced mail transfer including all critical mails
 */
export function fixMail(newHostString, originalHostString) {
  console.log("Transferring critical mail...");
  
  const newHostParts = isolateTag(newHostString, "mailReceived");
  const originalHostParts = isolateTag(originalHostString, "mailReceived");

  const newHostMail = newHostParts[1];
  const oldHostMail = originalHostParts[1];
  let mailString = newHostMail;

  // Enhanced mail list based on research
  const CRITICAL_MAIL = [
    ...config.TRANSFERRABLE_MAIL,
    "<string>landslideDone</string>", // Mine access
    "<string>grandpaEvaluation</string>", // Grandpa's letter
    "<string>hasRustyKey</string>", // Sewer access
    "<string>ccIsComplete</string>", // Community Center completion
    "<string>jojaComplete</string>", // Joja completion
    "<string>wizardJunimoNote</string>", // Wizard's junimo note
    "<string>seenJunimoNote</string>", // Seen junimo note
    "<string>willyBackRoomUnlocked</string>", // Willy's back room
  ];

  // Transfer all critical mails
  for (let mail of CRITICAL_MAIL) {
    if (oldHostMail.includes(mail) && !newHostMail.includes(mail)) {
      mailString += mail;
      console.log("Transferred mail:", mail);
    }
  }

  return newHostParts[0] + mailString + newHostParts[2];
}

/**
 * Enhanced events transfer including all critical events
 */
export function fixEvents(newHostString, originalHostString) {
  console.log("Transferring critical events...");
  
  const newHostParts = isolateTag(newHostString, "eventsSeen");
  const originalHostParts = isolateTag(originalHostString, "eventsSeen");

  const newHostEvents = newHostParts[1];
  const oldHostEvents = originalHostParts[1];
  let eventsString = newHostEvents;

  // Enhanced events list based on research
  const CRITICAL_EVENTS = [
    ...config.TRANSFERRABLE_EVENTS,
    "<int>60367</int>", // Wizard introduction
    "<int>112</int>", // Introduced to mines
    "<int>558291</int>", // Desert unlock
    "<int>2146991</int>", // Sewer access
    "<int>191393</int>", // Community center final
    "<int>502261</int>", // Joja final
    "<int>5755321</int>", // Grandpa evaluation
  ];

  // Transfer all critical events
  for (let event of CRITICAL_EVENTS) {
    if (oldHostEvents.includes(event) && !newHostEvents.includes(event)) {
      eventsString += event;
      console.log("Transferred event:", event);
    }
  }

  return newHostParts[0] + eventsString + newHostParts[2];
}

/**
 * Transfer critical progress flags (keys, abilities, etc.)
 */
export function transferProgressFlags(newHostString, originalHostString) {
  console.log("Transferring progress flags...");
  
  let result = newHostString;
  
  // Critical flags that should be transferred to maintain world progress
  const PROGRESS_FLAGS = [
    "hasRustyKey", // Sewer access
    "canUnderstandDwarves", // Dwarf scroll translation
    "hasClubCard", // Casino access  
    "hasDarkTalisman", // Witch's Swamp access
    "hasMagicInk", // Wizard ink
    "hasSkullKey", // Skull Cavern
    "daysUntilHouseUpgrade", // House upgrade progress
    "magneticRadius", // Magnet ring effects
    "hasWateringCanEnchantment", // Tool enchantments
  ];

  for (let flag of PROGRESS_FLAGS) {
    result = transferSingleFlag(result, originalHostString, flag);
  }

  return result;
}

/**
 * Helper function to transfer a single flag between players
 */
function transferSingleFlag(dest, source, flagName) {
  try {
    const destParts = isolateTag(dest, flagName);
    const sourceParts = isolateTag(source, flagName);
    
    // Only transfer if source has the flag and dest doesn't or has false
    if (sourceParts[1] && (sourceParts[1].trim() === "true" || parseInt(sourceParts[1]) > 0)) {
      console.log(`Transferring flag: ${flagName} = ${sourceParts[1]}`);
      return destParts[0] + sourceParts[1] + destParts[2];
    }
  } catch (error) {
    console.log(`Flag ${flagName} not found or error transferring:`, error.message);
  }
  
  return dest;
}

/**
 * Fix home location - new host gets FarmHouse, old host gets cabin
 */
export function fixHomeLocation(dest, homeLocationValue) {
  console.log("Setting home location for new host...");
  
  const destParts = isolateTag(dest, "homeLocation");
  
  // Extract just the value (FarmHouse) from the full tag
  const locationValue = homeLocationValue.replace(/<\/?homeLocation>/g, "");
  
  console.log(`Setting homeLocation to: ${locationValue}`);
  return destParts[0] + locationValue + destParts[2];
}

/**
 * Fix sleep location for new host
 */
export function fixSleepLocation(dest, source) {
  console.log("Updating last sleep location...");
  
  try {
    const destParts = isolateTag(dest, "lastSleepLocation");
    
    // New host should sleep in FarmHouse
    console.log("Setting lastSleepLocation to: FarmHouse");
    return destParts[0] + "FarmHouse" + destParts[2];
  } catch (error) {
    console.log("Could not update lastSleepLocation:", error.message);
    return dest;
  }
}

/**
 * Transfer house upgrade levels and related data
 */
export function fixUpgradeLevels(dest, source) {
  console.log("Transferring house upgrade levels...");
  
  let result = dest;

  // Transfer house upgrade level
  try {
    const destHouseParts = isolateTag(dest, "houseUpgradeLevel");
    const sourceHouseParts = isolateTag(source, "houseUpgradeLevel");
    
    if (sourceHouseParts[1]) {
      console.log(`Transferring houseUpgradeLevel: ${sourceHouseParts[1]}`);
      result = destHouseParts[0] + sourceHouseParts[1] + destHouseParts[2];
    }
  } catch (error) {
    console.log("Could not transfer houseUpgradeLevel:", error.message);
  }

  // Transfer days until house upgrade
  try {
    const destDaysParts = isolateTag(result, "daysUntilHouseUpgrade");
    const sourceDaysParts = isolateTag(source, "daysUntilHouseUpgrade");
    
    if (sourceDaysParts[1]) {
      console.log(`Transferring daysUntilHouseUpgrade: ${sourceDaysParts[1]}`);
      result = destDaysParts[0] + sourceDaysParts[1] + destDaysParts[2];
    }
  } catch (error) {
    console.log("Could not transfer daysUntilHouseUpgrade:", error.message);
  }

  return result;
}

/**
 * Update farmhand's home location to point to a cabin
 * This should be called for the old host who becomes a farmhand
 */
export function setFarmhandHomeLocation(farmhandData, cabinId) {
  console.log(`Setting farmhand home location to cabin: ${cabinId}`);
  
  try {
    const parts = isolateTag(farmhandData, "homeLocation");
    const newLocation = cabinId || "FarmHouse"; // Fallback to FarmHouse if no cabin ID
    
    return parts[0] + newLocation + parts[2];
  } catch (error) {
    console.log("Could not set farmhand home location:", error.message);
    return farmhandData;
  }
}

/**
 * Update cabin ownership in the world data
 * This function should be called to update building references
 */
export function updateCabinOwnership(saveGameXml, oldHostId, newHostId) {
  console.log("Updating cabin ownership references...");
  
  let updatedXml = saveGameXml;
  
  // Find and update farmhandReference in cabin buildings
  const cabinPattern = /<Building[^>]*>[\s\S]*?<name>Cabin<\/name>[\s\S]*?<farmhandReference>(\d+)<\/farmhandReference>[\s\S]*?<\/Building>/g;
  
  let match;
  while ((match = cabinPattern.exec(saveGameXml)) !== null) {
    const cabinBlock = match[0];
    const currentRef = match[1];
    
    if (currentRef === newHostId) {
      // This cabin belonged to the new host, now assign it to old host
      const updatedCabinBlock = cabinBlock.replace(
        `<farmhandReference>${currentRef}</farmhandReference>`,
        `<farmhandReference>${oldHostId}</farmhandReference>`
      );
      
      // Also update owner field if present
      const ownerUpdatedBlock = updatedCabinBlock.replace(
        /<owner>\d+<\/owner>/,
        `<owner>${oldHostId}</owner>`
      );
      
      updatedXml = updatedXml.replace(cabinBlock, ownerUpdatedBlock);
      console.log(`Updated cabin ownership: ${currentRef} -> ${oldHostId}`);
      break;
    }
  }
  
  return updatedXml;
}
