/**
 * Stardew Valley Host Swap Tool - UI Controller Module
 * Controls the user interface
 */

import * as config from "./config.js";
import { showMessage, showError, copyToClipboard, removeBOM } from "./utils.js";
import { selectNewHost, swapHost } from "./characterHandler.js";
import { createDownload, handleFileUpload } from "./fileHandler.js";

/**
 * Display characters in the UI
 */
export function displayCharacters() {
  const characterSection = document.getElementById("character-section");
  if (!characterSection) {
    // Old UI version
    displayCharactersLegacy();
    return;
  }

  characterSection.style.display = "block";

  const characterList = document.getElementById("character-list");
  if (!characterList) {
    return;
  }

  characterList.innerHTML = "";

  // Add host character
  if (config.hostCharacter) {
    const hostCard = document.createElement("div");
    hostCard.className = "character-card host-character";
    hostCard.dataset.name = config.hostCharacter.name;
    hostCard.dataset.type = "host";

    hostCard.innerHTML = `
            <div class="character-name">${config.hostCharacter.name}</div>
            <div class="character-type">Current Host</div>
        `;

    characterList.appendChild(hostCard);
  }

  // Add farmhand characters
  config.farmhands.forEach((farmhand) => {
    const farmhandCard = document.createElement("div");
    farmhandCard.className = "character-card";
    farmhandCard.dataset.name = farmhand.name;
    farmhandCard.dataset.type = "farmhand";

    farmhandCard.innerHTML = `
            <div class="character-name">${farmhand.name}</div>
            <div class="character-type">Farmhand</div>
        `;

    farmhandCard.addEventListener("click", function () {
      selectNewHost(farmhand.name);
    });

    characterList.appendChild(farmhandCard);
  });

  // Enable swap button if there are farmhands
  const swapButton = document.getElementById("swap-button");
  if (swapButton) {
    swapButton.disabled = config.farmhands.length === 0;
  }

  if (config.farmhands.length === 0) {
    showMessage(
      "No farmhands found in this save file. There must be at least one farmhand to perform a host swap.",
      "error"
    );
  }
}

/**
 * Display characters in the legacy UI
 */
export function displayCharactersLegacy() {
  // For compatibility with the original interface
  let players = [];
  let hostName = "";

  if (config.hostCharacter) {
    hostName = config.hostCharacter.name;
  }

  // Only add farmhands to the selectable list
  config.farmhands.forEach((farmhand, index) => {
    // Start farmhand indices at 3, since 1 is host and 2 is reserved for host data
    players.push([farmhand.name, index + 3]);
  });

  const div = document.getElementById("instructions");
  while (div.firstChild) {
    div.removeChild(div.firstChild);
  }

  if (players.length === 0 && !hostName) {
    const t = document.createTextNode(
      "Error: The save file couldn't be read. Check that the whole thing is pasted, and it starts with '<?xml...'"
    );
    div.appendChild(t);
  } else {
    // Show the current host
    if (hostName) {
      const hostInfo = document.createElement("p");
      hostInfo.innerHTML = `<strong>Current host:</strong> ${hostName}`;
      div.appendChild(hostInfo);
    }

    const t = document.createTextNode("Select new host (may take a minute): ");
    div.appendChild(t);

    for (let i = 0; i < players.length; i++) {
      const input = document.createElement("input");
      input.setAttribute("type", "submit");
      input.setAttribute("value", players[i][0]);
      input.setAttribute("onclick", "legacySwap('" + players[i][0] + "')");
      div.appendChild(input);
    }

    if (players.length === 0) {
      const p = document.createElement("p");
      p.setAttribute("id", "instruction2");
      const t = document.createTextNode(
        "No farmhands (additional players) found."
      );
      p.appendChild(t);
      div.appendChild(p);
    }
  }
}

/**
 * Swap function for the legacy UI
 */
export function legacySwap(characterName) {
  selectNewHost(characterName);

  if (swapHost()) {
    // Show in the old UI style
    const div = document.getElementById("instructions");
    const instruction2 = document.getElementById("instruction2");
    if (instruction2) div.removeChild(instruction2);

    const p = document.createElement("p");
    p.setAttribute("id", "instruction2");
    const t = document.createTextNode(
      `New host: ${characterName}. Click the "Copy to clipboard" button below to copy the modified save file. Then overwrite the contents of your save file with the copied data. Send your whole save folder to the new host to put in their Saves folder.`
    );
    p.appendChild(t);
    div.appendChild(p);

    // Show a button to copy the content
    const copyButton = document.querySelector(
      ".legacy-section .download-button"
    );
    if (copyButton) {
      copyButton.style.display = "inline-block";
    }
  }
}

/**
 * Handle the swap button click
 */
export function handleSwapButtonClick() {
  if (swapHost()) {
    // Show the result section and enable the download link
    const resultSection = document.getElementById("result-section");
    if (resultSection) {
      resultSection.style.display = "block";
    }

    const downloadLink = document.getElementById("download-link");
    if (downloadLink) {
      downloadLink.style.pointerEvents = "auto";
      downloadLink.style.opacity = "1";
      downloadLink.title = "Click to download the modified file";
    }

    // Create download
    createDownload();
    
    // Populate copy textareas
    populateCopyTextareas();
    
    // Setup tabs and copy functionality
    setupTabsAndCopy();

    showMessage(
      `Host successfully changed to ${config.selectedNewHost}!`,
      "success"
    );
  }
}

/**
 * Populate the copy textareas with the modified save files
 */
function populateCopyTextareas() {
  const saveGameTextarea = document.getElementById("saveGame-text");
  const saveGameInfoTextarea = document.getElementById("saveGameInfo-text");
  
  if (saveGameTextarea && config.originalFiles.saveGame) {
    saveGameTextarea.value = removeBOM(config.originalFiles.saveGame);
  }
  
  if (saveGameInfoTextarea && config.originalFiles.saveGameInfo) {
    saveGameInfoTextarea.value = removeBOM(config.originalFiles.saveGameInfo);
  }
}

/**
 * Set up UI event listeners
 */
export function setupUIEventListeners() {
  // Configure the drop zone behavior
  const dropZone = document.getElementById("drop-zone");
  if (dropZone) {
    dropZone.addEventListener("dragover", function (e) {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });

    dropZone.addEventListener("dragleave", function () {
      dropZone.classList.remove("dragover");
    });

    dropZone.addEventListener("drop", function (e) {
      e.preventDefault();
      dropZone.classList.remove("dragover");

      // Use the imported function directly
      handleFileUpload(e);
    });
  }

  // Configure swap button
  const swapButton = document.getElementById("swap-button");
  if (swapButton) {
    swapButton.addEventListener("click", handleSwapButtonClick);
  }
  
  // Setup tabs and copy functionality for direct file copying
  setupTabsAndCopy();
}

/**
 * Function for backward compatibility
 */
export function copyToClipboardLegacy() {
  // Copy the modified save file to the clipboard from originalFiles
  // instead of using the removed output textarea
  if (config.originalFiles.saveGame) {
    copyToClipboard(
      config.originalFiles.saveGame,
      "Modified save file copied to clipboard!"
    );
  }
}

/**
 * Setup tabs in the copy section
 */
function setupTabsAndCopy() {
  // Setup tabs
  const tabButtons = document.querySelectorAll('.tab-button');
  
  if (tabButtons.length === 0) {
    return;
  }
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons and panes
      tabButtons.forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
      
      // Add active class to current button
      this.classList.add('active');
      
      // Show corresponding pane
      const target = this.getAttribute('data-file');
      document.getElementById(`${target}-content`).classList.add('active');
    });
  });
  
  // Setup copy buttons
  const copyButtons = document.querySelectorAll('.copy-button');
  
  copyButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      const textarea = document.getElementById(targetId);
      
      copyToClipboard(textarea.value, `${targetId.split('-')[0]} file copied to clipboard!`);
    });
  });
}
