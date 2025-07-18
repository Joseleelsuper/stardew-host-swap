/**
 * Stardew Valley Host Swap Tool - Configuration Module
 */

export let originalFiles = {
  saveGame: null,
  saveGameInfo: null,
  additionalCropData: null,
};

export let backupFiles = {
  saveGame: null,
  saveGameInfo: null,
  additionalCropData: null,
};

export let hostCharacter = null;
export let farmhands = [];
export let selectedNewHost = null;
export let saveFileName = "";

export const TRANSFERRABLE_MAIL = [
  "<string>ccDoorUnlock</string>",
  "<string>ccPantry</string>",
  "<string>ccCraftsRoom</string>",
  "<string>ccFishTank</string>",
  "<string>ccBoilerRoom</string>",
  "<string>ccBulletin</string>",
  "<string>ccVault</string>",
  "<string>jojaPantry</string>",
  "<string>jojaCraftsRoom</string>",
  "<string>jojaFishTank</string>",
  "<string>jojaBoilerRoom</string>",
  "<string>jojaVault</string>",
  "<string>JojaMember</string>",
  "<string>spring_2_1</string>", // Willy's shop unlock
  "<string>landslideDone</string>", // Mine access after landslide
  "<string>willyBackRoomUnlocked</string>", // Willy's back room access
  "<string>doorUnlockDesert</string>", // Desert bus unlock
  "<string>ccIsComplete</string>", // Community center completion
  "<string>jojaComplete</string>", // Joja completion
];

export const TRANSFERRABLE_EVENTS = [
  "<int>65</int>", // Bats or mushrooms
  "<int>1590166</int>", // Marnie gives you a cat
  "<int>897405</int>", // Marnie gives you a dog
  "<int>611439</int>", // Community center unlocked
  "<int>191393</int>", // Community center final cutscene
  "<int>502261</int>", // Joja final cutscene
  "<int>112</int>", // Introduced to mines
  "<int>60367</int>", // Wizard introduction event
  "<int>558291</int>", // Desert unlock event
  "<int>2146991</int>", // Sewer access event
  "<int>5755321</int>", // Grandpa evaluation event
];

// Reset data
export function resetData() {
  originalFiles.saveGame = null;
  originalFiles.saveGameInfo = null;
  originalFiles.additionalCropData = null;

  backupFiles.saveGame = null;
  backupFiles.saveGameInfo = null;
  backupFiles.additionalCropData = null;

  hostCharacter = null;
  farmhands = [];
  selectedNewHost = null;
  saveFileName = "";
}

export function setSelectedNewHost(name) {
  selectedNewHost = name;
}

export function setSaveFileName(name) {
  saveFileName = name;
}

export function setHostCharacter(host) {
  hostCharacter = host;
}

export function setFarmhands(hands) {
  farmhands = hands;
}

export function updateOriginalFiles(key, value) {
  originalFiles[key] = value;
  console.log(`Updated originalFiles.${key} with value of length:`, value.length);
}
export function updateBackupFiles(key, value) {
  backupFiles[key] = value;
}
