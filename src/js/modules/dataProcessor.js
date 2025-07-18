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

/**
 * Fix old host data when they become a farmhand
 * This transfers necessary data from the new host to the old host
 * @param {string} oldHostContent - The old host's content (who becomes farmhand)
 * @param {string} newHostOriginalContent - The original content of who becomes new host
 * @returns {string} - Fixed old host content for farmhand role
 */
export function fixOldHostAsFarmhand(oldHostContent, newHostOriginalContent) {
  console.log("=== FIXING OLD HOST AS FARMHAND ===");
  
  let fixedContent = oldHostContent;
  
  // 1. Transfer the new host's original homeLocation (their cabin) to old host
  fixedContent = transferHomeLocationFromNewHost(fixedContent, newHostOriginalContent);
  
  // 2. Transfer relevant cabin-related data
  fixedContent = transferCabinRelatedData(fixedContent, newHostOriginalContent);
  
  // 3. Update sleep location to match new home
  fixedContent = updateFarmhandSleepLocation(fixedContent, newHostOriginalContent);
  
  // 4. Preserve some old host's important data that shouldn't change
  fixedContent = preserveImportantHostData(fixedContent, oldHostContent);
  
  console.log("=== OLD HOST FARMHAND FIXES COMPLETED ===");
  return fixedContent;
}

/**
 * Transfer home location from new host's original data to old host
 */
function transferHomeLocationFromNewHost(oldHostContent, newHostOriginalContent) {
  console.log("Transferring home location from new host to old host...");
  
  try {
    const newHostHomeMatch = newHostOriginalContent.match(/<homeLocation>(.*?)<\/homeLocation>/);
    const newHostOriginalHome = newHostHomeMatch ? newHostHomeMatch[1] : "FarmHouse";
    
    console.log("New host's original home location:", newHostOriginalHome);
    
    // If new host had a cabin, old host should inherit it
    if (newHostOriginalHome && newHostOriginalHome !== "FarmHouse") {
      return setFarmhandHomeLocation(oldHostContent, newHostOriginalHome);
    } else {
      // Fallback: keep old host in FarmHouse (shouldn't normally happen)
      console.log("New host was in FarmHouse, keeping old host in FarmHouse as fallback");
      return setFarmhandHomeLocation(oldHostContent, "FarmHouse");
    }
  } catch (error) {
    console.log("Error transferring home location:", error.message);
    return oldHostContent;
  }
}

/**
 * Transfer cabin-related data from new host to old host
 */
function transferCabinRelatedData(oldHostContent, newHostOriginalContent) {
  console.log("Transferring cabin-related data...");
  
  let result = oldHostContent;
  
  // Data that should be transferred from the new host's original cabin setup
  const CABIN_RELATED_DATA = [
    "cabinStyle", // Cabin appearance style
    "mailboxPosition", // Position of mailbox relative to cabin
    "farmhandSpouse", // Spouse living in the cabin (if any)
  ];
  
  for (let data of CABIN_RELATED_DATA) {
    try {
      const sourceParts = isolateTag(newHostOriginalContent, data);
      if (sourceParts[1]) {
        const destParts = isolateTag(result, data);
        result = destParts[0] + sourceParts[1] + destParts[2];
        console.log(`Transferred ${data}: ${sourceParts[1]}`);
      }
    } catch (error) {
      console.log(`Could not transfer ${data}:`, error.message);
    }
  }
  
  return result;
}

/**
 * Update farmhand's sleep location to match their new home
 */
function updateFarmhandSleepLocation(farmhandContent, newHostOriginalContent) {
  console.log("Updating farmhand sleep location...");
  
  try {
    // Get the home location that we're setting for this farmhand
    const homeMatch = newHostOriginalContent.match(/<homeLocation>(.*?)<\/homeLocation>/);
    const homeLocation = homeMatch ? homeMatch[1] : "FarmHouse";
    
    const parts = isolateTag(farmhandContent, "lastSleepLocation");
    
    console.log(`Setting lastSleepLocation to: ${homeLocation}`);
    return parts[0] + homeLocation + parts[2];
  } catch (error) {
    console.log("Could not update farmhand sleep location:", error.message);
    return farmhandContent;
  }
}

/**
 * Preserve important data that the old host should keep
 */
function preserveImportantHostData(newContent, originalOldHostContent) {
  console.log("Preserving important old host data...");
  
  let result = newContent;
  
  // Data that the old host should keep (personal achievements, relationships, etc.)
  const PRESERVE_DATA = [
    "spouse", // Marriage status
    "divorceTonight", // Divorce status  
    "friendshipData", // Personal relationships
    "achievements", // Personal achievements
    "fishCaught", // Personal fishing records
    "archaeologyFound", // Personal archaeology finds
    "mineralsFound", // Personal mineral collection
    "recipesCooked", // Personal cooking records
    "stats", // Personal statistics
    "personalInventory", // Some personal inventory items
  ];
  
  for (let data of PRESERVE_DATA) {
    try {
      const originalParts = isolateTag(originalOldHostContent, data);
      if (originalParts[1]) {
        const destParts = isolateTag(result, data);
        result = destParts[0] + originalParts[1] + destParts[2];
        console.log(`Preserved old host's ${data}`);
      }
    } catch (error) {
      console.log(`Could not preserve ${data}:`, error.message);
    }
  }
  
  return result;
}
