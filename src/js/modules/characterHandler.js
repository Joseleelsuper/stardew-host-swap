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

      // Convert host to farmhand based on the farmhand type
      let newFarmhandData;
      if (selectedFarmhand.type === "farmhand") {
        newFarmhandData = hostData
          .replace(/<player>/g, "<farmhand>")
          .replace(/<\/player>/g, "</farmhand>");
      } else if (selectedFarmhand.type === "farmer") {
        newFarmhandData = hostData
          .replace(/<player>/g, "<Farmer>")
          .replace(/<\/player>/g, "</Farmer>");
      }

      // Convert farmhand to host based on the current farmhand structure
      let newHostData;
      if (selectedFarmhand.type === "farmhand") {
        newHostData = farmhandData
          .replace(/<farmhand>/g, "<player>")
          .replace(/<\/farmhand>/g, "</player>");
      } else if (selectedFarmhand.type === "farmer") {
        newHostData = farmhandData
          .replace(/<Farmer>/g, "<player>")
          .replace(/<\/Farmer>/g, "</player>");
      }

      // Fix mail, events, and house upgrade levels
      const fixedNewHostData = fixHostData(newHostData, hostData);

      // Create new save game XML by replacing content
      console.log("Before swap - Host data length:", hostData.length);
      console.log("Before swap - Farmhand data length:", farmhandData.length);
      console.log("Host data found in XML:", newSaveGameXml.includes(hostData));
      console.log("Farmhand data found in XML:", newSaveGameXml.includes(farmhandData));
      
      const originalLength = newSaveGameXml.length;
      newSaveGameXml = newSaveGameXml.replace(hostData, fixedNewHostData);
      console.log("After host replacement - length changed:", newSaveGameXml.length !== originalLength);
      
      const afterHostLength = newSaveGameXml.length;
      newSaveGameXml = newSaveGameXml.replace(farmhandData, newFarmhandData);
      console.log("After farmhand replacement - length changed:", newSaveGameXml.length !== afterHostLength);
      
      console.log("After swap - New save game XML length:", newSaveGameXml.length);
      console.log("Original save game XML length:", config.originalFiles.saveGame.length);
      console.log("Changes made:", newSaveGameXml !== config.originalFiles.saveGame);

      // Update SaveGameInfo to contain new host information
      console.log("Updating SaveGameInfo...");
      console.log("Original SaveGameInfo length:", config.originalFiles.saveGameInfo.length);
      
      newSaveGameInfoXml = updateSaveGameInfo(fixedNewHostData, config.originalFiles.saveGameInfo);
      
      console.log("Updated SaveGameInfo length:", newSaveGameInfoXml.length);
      console.log("SaveGameInfo changed:", newSaveGameInfoXml !== config.originalFiles.saveGameInfo);

      // Update global variables with new content
      config.updateOriginalFiles("saveGame", newSaveGameXml);
      config.updateOriginalFiles("saveGameInfo", newSaveGameInfoXml);
      
      console.log("=== FINAL VERIFICATION ===");
      console.log("SaveGame changed:", 
        config.originalFiles.saveGame !== config.backupFiles.saveGame);
      console.log("SaveGameInfo changed:", 
        config.originalFiles.saveGameInfo !== config.backupFiles.saveGameInfo);
      console.log("SaveGame length:", config.originalFiles.saveGame.length);
      console.log("SaveGameInfo length:", config.originalFiles.saveGameInfo.length);

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

/**
 * Update SaveGameInfo with new host data
 */
function updateSaveGameInfo(newHostData, originalSaveGameInfo) {
  console.log("Updating SaveGameInfo with new host data...");
  
  // First, remove any player tags if they exist and extract the content
  let farmerContent;
  
  if (newHostData.includes('<player>') && newHostData.includes('</player>')) {
    // Extract content from player tags (remove player wrapper)
    const playerMatch = newHostData.match(/<player>([\s\S]*?)<\/player>/i);
    if (!playerMatch) {
      console.error("No player data found in player block");
      return originalSaveGameInfo;
    }
    farmerContent = playerMatch[1];
    console.log("Extracted content from player tags, length:", farmerContent.length);
  } else if (newHostData.includes('<Farmer') && newHostData.includes('</Farmer>')) {
    // Complete Farmer block - extract just the content
    const farmerMatch = newHostData.match(/<Farmer[^>]*>([\s\S]*?)<\/Farmer>/i);
    if (!farmerMatch) {
      console.error("No Farmer data found in complete block");
      return originalSaveGameInfo;
    }
    farmerContent = farmerMatch[1];
    console.log("Extracted farmer content from complete block, length:", farmerContent.length);
  } else {
    // Just the content - use as is
    farmerContent = newHostData;
    console.log("Using raw farmer content, length:", farmerContent.length);
  }
  
  // For SaveGameInfo, we need to preserve the XML declaration and namespace attributes
  // Check if the original has XML declaration
  const xmlDeclarationMatch = originalSaveGameInfo.match(/^<\?xml[^>]+\?>/);
  const xmlDeclaration = xmlDeclarationMatch ? xmlDeclarationMatch[0] : '';
  
  // Build the complete Farmer block with namespaces (no player tags)
  const farmerBlockWithNamespaces = `<Farmer xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">${farmerContent}</Farmer>`;
  
  // The SaveGameInfo should be the XML declaration + the complete Farmer block
  let newSaveGameInfo;
  
  if (xmlDeclaration) {
    newSaveGameInfo = xmlDeclaration + farmerBlockWithNamespaces;
  } else {
    newSaveGameInfo = farmerBlockWithNamespaces;
  }
  
  console.log("New SaveGameInfo created, length:", newSaveGameInfo.length);
  console.log("SaveGameInfo successfully updated (player tags removed)");
  
  return newSaveGameInfo;
}
