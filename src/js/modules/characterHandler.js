/**
 * Stardew Valley Host Swap Tool - Character Handler Module
 * Processes and manages characters from save files
 */

import * as config from "./config.js";
import { showError, showMessage } from "./utils.js";
import { fixHostData } from "./dataProcessor.js";

/**
 * Parse characters from the save file
 */
export function parseCharacters() {
  try {
    const saveGameXml = config.originalFiles.saveGame;

    if (!saveGameXml) {
      showError("No content found in save file. Please try loading it again.");
      return false;
    }

    // Reset character data
    config.setHostCharacter(null);
    config.setFarmhands([]);

    // Parse the host character (player tag)
    const hostMatch = saveGameXml.match(/<player>([\s\S]*?)<\/player>/);
    if (hostMatch) {
      const hostContent = hostMatch[1];
      const nameMatch = hostContent.match(/<name>(.*?)<\/name>/);

      if (nameMatch && nameMatch[1] !== "Axe") {
        const host = {
          name: nameMatch[1],
          type: "host",
          content: hostMatch[0],
          index: saveGameXml.indexOf(hostMatch[0]),
        };
        config.setHostCharacter(host);
      }
    }

    // Parse farmhands
    const farmhandPattern = /<farmhand>([\s\S]*?)<\/farmhand>/g;
    let farmhandMatch;
    let hands = [];

    while ((farmhandMatch = farmhandPattern.exec(saveGameXml)) !== null) {
      const farmhandContent = farmhandMatch[1];
      const nameMatch = farmhandContent.match(/<name>(.*?)<\/name>/);

      if (nameMatch && nameMatch[1] !== "Axe" && nameMatch[1] !== "Pickaxe") {
        hands.push({
          name: nameMatch[1],
          type: "farmhand",
          content: farmhandMatch[0],
          index: farmhandMatch.index,
        });
      }
    }

    // Also check for Farmer tags (in case of different XML structure)
    if (hands.length === 0) {
      const farmerPattern = /<Farmer>([\s\S]*?)<\/Farmer>/g;
      let farmerMatch;

      while ((farmerMatch = farmerPattern.exec(saveGameXml)) !== null) {
        // Skip if this is the host's Farmer tag (inside the player tag)
        if (
          config.hostCharacter &&
          config.hostCharacter.content.includes(farmerMatch[0])
        ) {
          continue;
        }

        const farmerContent = farmerMatch[1];
        const nameMatch = farmerContent.match(/<name>(.*?)<\/name>/);

        if (nameMatch && nameMatch[1] !== "Axe" && nameMatch[1] !== "Pickaxe") {
          hands.push({
            name: nameMatch[1],
            type: "farmer",
            content: farmerMatch[0],
            index: farmerMatch.index,
          });
        }
      }
    }

    config.setFarmhands(hands);

    // Display characters - import here to avoid circular reference
    import("./uiController.js").then((ui) => {
      ui.displayCharacters();
    });

    return true;
  } catch (error) {
    showError(
      "Error parsing save file. The file might be corrupted or in an unsupported format."
    );
    return false;
  }
}

/**
 * Select a new host
 */
export function selectNewHost(name) {
  config.setSelectedNewHost(name);

  // Update UI to show selection
  const characterCards = document.querySelectorAll(".character-card");
  characterCards.forEach((card) => {
    if (card.dataset.name === name) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });

  // Enable swap button
  const swapButton = document.getElementById("swap-button");
  if (swapButton) {
    swapButton.disabled = false;
  }
}

/**
 * Perform the host swap
 */
export function swapHost() {
  if (!config.selectedNewHost) {
    showError("Please select a new host first.");
    return;
  }

  // Show loading if available
  const loadingElement = document.getElementById("loading");
  if (loadingElement) {
    loadingElement.style.display = "block";
  }

  try {
    let newSaveGameXml = config.originalFiles.saveGame;
    let newSaveGameInfoXml = config.originalFiles.saveGameInfo;

    // If the current host is selected, no changes are needed
    if (
      config.hostCharacter &&
      config.selectedNewHost === config.hostCharacter.name
    ) {
      showMessage("The selected character is already the host.", "info");
      if (loadingElement) {
        loadingElement.style.display = "none";
      }
      return;
    }

    // Find the selected farmhand
    const selectedFarmhand = config.farmhands.find(
      (fh) => fh.name === config.selectedNewHost
    );

    if (selectedFarmhand && config.hostCharacter) {
      // Extract necessary data
      const hostData = config.hostCharacter.content;
      const farmhandData = selectedFarmhand.content;

      // Convert host to farmhand
      const newFarmhandData = hostData
        .replace(/<player>/g, "<farmhand>")
        .replace(/<\/player>/g, "</farmhand>");

      // Convert farmhand to host
      const newHostData = farmhandData
        .replace(/<farmhand>/g, "<player>")
        .replace(/<\/farmhand>/g, "</player>");

      // Fix mail, events, and house upgrade levels
      const fixedNewHostData = fixHostData(newHostData, hostData);

      // Create new save game XML by replacing content
      newSaveGameXml = newSaveGameXml.replace(hostData, fixedNewHostData);
      newSaveGameXml = newSaveGameXml.replace(farmhandData, newFarmhandData);

      // Update SaveGameInfo to contain new host information
      // Extract Farmer tag from new host data
      const farmerMatch = fixedNewHostData.match(
        /<Farmer>([\s\S]*?)<\/Farmer>/i
      );
      if (farmerMatch) {
        const farmerData = farmerMatch[0];

        // SaveGameInfo contains a Farmer tag with XML namespace attributes
        const xmlnsPattern =
          /<Farmer xmlns:xsi="http:\/\/www\.w3\.org\/2001\/XMLSchema-instance" xmlns:xsd="http:\/\/www\.w3\.org\/2001\/XMLSchema">([\s\S]*?)<\/Farmer>/;
        const saveGameInfoMatch =
          config.originalFiles.saveGameInfo.match(xmlnsPattern);

        if (saveGameInfoMatch) {
          // Keep XML namespace attributes but replace content
          const farmerContent = farmerData
            .replace(/<Farmer>/i, "")
            .replace(/<\/Farmer>/i, "");
          newSaveGameInfoXml = config.originalFiles.saveGameInfo.replace(
            xmlnsPattern,
            `<Farmer xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">${farmerContent}</Farmer>`
          );
        }
      }

      // Update global variables with new content
      config.updateOriginalFiles("saveGame", newSaveGameXml);
      config.updateOriginalFiles("saveGameInfo", newSaveGameInfoXml);

      return true;
    } else {
      showError("Selected character not found.");
      return false;
    }
  } catch (error) {
    showError("Error swapping host: " + error.message);
    return false;
  } finally {
    // Hide loading
    if (loadingElement) {
      loadingElement.style.display = "none";
    }
  }
}
