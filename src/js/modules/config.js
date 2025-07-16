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
];

export const TRANSFERRABLE_EVENTS = [
  "<int>65</int>", // Bats or mushrooms
  "<int>1590166</int>", // Marnie gives you a cat
  "<int>897405</int>", // Marnie gives you a dog
  "<int>611439</int>", // Community center unlocked
  "<int>191393</int>", // Community center final cutscene
  "<int>502261</int>", // Joja final cutscene
];

// Reset data
export function resetData() {
  originalFiles = {
    saveGame: null,
    saveGameInfo: null,
    additionalCropData: null,
  };

  backupFiles = {
    saveGame: null,
    saveGameInfo: null,
    additionalCropData: null,
  };

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
}
export function updateBackupFiles(key, value) {
  backupFiles[key] = value;
}
