/**
 * Stardew Valley Host Swap Tool - Character Handler Module
 * Processes and manages characters from save files
 */

import * as config from "./config.js";
import { showError, showMessage } from "./utils.js";
import { fixHostData, setFarmhandHomeLocation, updateCabinOwnership } from "./dataProcessor.js";

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
      console.log("=== STARTING HOST SWAP ===");
      console.log("Current host:", config.hostCharacter.name);
      console.log("New host:", config.selectedNewHost);
      console.log("Farmhand type:", selectedFarmhand.type);

      // Extract the complete blocks including tags
      const originalHostBlock = config.hostCharacter.content; // <player>...</player>
      const originalFarmhandBlock = selectedFarmhand.content; // <farmhand>...</farmhand> or <Farmer>...</Farmer>

      console.log("Original host block length:", originalHostBlock.length);
      console.log("Original farmhand block length:", originalFarmhandBlock.length);
      
      // Validate that we have complete blocks
      if (!originalHostBlock || !originalFarmhandBlock) {
        throw new Error("Missing character data blocks");
      }

      // Extract just the inner content (without the wrapper tags)
      const hostInnerContent = extractInnerContent(originalHostBlock, "player");
      const farmhandInnerContent = extractInnerContent(originalFarmhandBlock, selectedFarmhand.type);

      console.log("Extracted host inner content length:", hostInnerContent.length);
      console.log("Extracted farmhand inner content length:", farmhandInnerContent.length);
      
      // Validate extraction was successful
      if (!hostInnerContent || !farmhandInnerContent) {
        throw new Error("Failed to extract inner content from character blocks");
      }

      // Swap the UniqueMultiplayerID values in the inner content
      const { newHostContent, newFarmhandContent } = swapPlayerIDs(farmhandInnerContent, hostInnerContent);

      console.log("After ID swap - new host content length:", newHostContent.length);
      console.log("After ID swap - new farmhand content length:", newFarmhandContent.length);

      // Apply data fixes to the new host content (mail, events, house upgrades, etc.)
      const fixedNewHostContent = fixHostData(
        `<player>${newHostContent}</player>`, 
        `<player>${hostInnerContent}</player>`
      );
      const finalNewHostContent = extractInnerContent(fixedNewHostContent, "player");

      console.log("After fixes - final new host content length:", finalNewHostContent.length);

      // Create the new blocks by wrapping the swapped content with the original tags
      const newHostBlock = `<player>${finalNewHostContent}</player>`;
      let newFarmhandBlock;
      
      // Fix the farmhand's home location to point to the old host's cabin
      let updatedFarmhandContent = newFarmhandContent;
      
      // Extract the old host's home location to determine cabin ID
      const oldHostHomeMatch = hostInnerContent.match(/<homeLocation>(.*?)<\/homeLocation>/);
      const oldHostHome = oldHostHomeMatch ? oldHostHomeMatch[1] : null;
      
      if (oldHostHome && oldHostHome !== "FarmHouse") {
        // Old host had a cabin, new farmhand should use FarmHouse as fallback
        // or we could assign them to a different cabin
        console.log("Old host had cabin:", oldHostHome);
        updatedFarmhandContent = setFarmhandHomeLocation(updatedFarmhandContent, "FarmHouse");
      } else {
        // Try to find an available cabin ID from the farmhand's original location
        const farmhandHomeMatch = farmhandInnerContent.match(/<homeLocation>(.*?)<\/homeLocation>/);
        const farmhandHome = farmhandHomeMatch ? farmhandHomeMatch[1] : null;
        
        if (farmhandHome && farmhandHome !== "FarmHouse") {
          console.log("Setting old host to farmhand's cabin:", farmhandHome);
          updatedFarmhandContent = setFarmhandHomeLocation(updatedFarmhandContent, farmhandHome);
        } else {
          console.log("No specific cabin found, using FarmHouse as fallback");
          updatedFarmhandContent = setFarmhandHomeLocation(updatedFarmhandContent, "FarmHouse");
        }
      }
      
      if (selectedFarmhand.type === "farmhand") {
        newFarmhandBlock = `<farmhand>${updatedFarmhandContent}</farmhand>`;
      } else if (selectedFarmhand.type === "farmer") {
        newFarmhandBlock = `<Farmer>${updatedFarmhandContent}</Farmer>`;
      }

      // Validate new blocks
      console.log("New host block length:", newHostBlock.length);
      console.log("New farmhand block length:", newFarmhandBlock.length);
      
      if (!newHostBlock || !newFarmhandBlock || newHostBlock.length < 100 || newFarmhandBlock.length < 100) {
        throw new Error("Generated blocks are too short or invalid");
      }

      console.log("=== PERFORMING REPLACEMENTS ===");
      console.log("Original host block found:", newSaveGameXml.includes(originalHostBlock));
      console.log("Original farmhand block found:", newSaveGameXml.includes(originalFarmhandBlock));

      // Replace the complete blocks in the save game XML
      // The tags stay in their original positions, only the content changes
      const beforeLength = newSaveGameXml.length;
      newSaveGameXml = newSaveGameXml.replace(originalHostBlock, newHostBlock);
      console.log("Host replacement successful:", newSaveGameXml.length !== beforeLength);
      
      const afterHostLength = newSaveGameXml.length;
      newSaveGameXml = newSaveGameXml.replace(originalFarmhandBlock, newFarmhandBlock);
      console.log("Farmhand replacement successful:", newSaveGameXml.length !== afterHostLength);
      
      // Validate final XML length
      if (newSaveGameXml.length < config.originalFiles.saveGame.length * 0.8) {
        throw new Error("Final XML is suspiciously short - possible data loss");
      }
      
      console.log("Final save game XML length:", newSaveGameXml.length);
      console.log("Original save game XML length:", config.originalFiles.saveGame.length);

      // Update cabin ownership references in buildings
      console.log("=== UPDATING CABIN OWNERSHIP ===");
      const oldHostIdMatch = hostInnerContent.match(/<UniqueMultiplayerID>(\d+)<\/UniqueMultiplayerID>/);
      const newHostIdMatch = farmhandInnerContent.match(/<UniqueMultiplayerID>(\d+)<\/UniqueMultiplayerID>/);
      
      if (oldHostIdMatch && newHostIdMatch) {
        const oldHostId = oldHostIdMatch[1];
        const newHostOriginalId = newHostIdMatch[1];
        
        console.log("Updating cabin ownership from", newHostOriginalId, "to", oldHostId);
        newSaveGameXml = updateCabinOwnership(newSaveGameXml, oldHostId, newHostOriginalId);
      }

      // Update SaveGameInfo with the new host information
      console.log("=== UPDATING SAVEGAMEINFO ===");
      newSaveGameInfoXml = updateSaveGameInfo(newHostBlock, config.originalFiles.saveGameInfo);

      // Update global variables with new content
      config.updateOriginalFiles("saveGame", newSaveGameXml);
      config.updateOriginalFiles("saveGameInfo", newSaveGameInfoXml);
      
      console.log("=== SWAP COMPLETED ===");
      console.log("SaveGame changed:", newSaveGameXml !== config.originalFiles.saveGame);
      console.log("SaveGameInfo changed:", newSaveGameInfoXml !== config.originalFiles.saveGameInfo);

      return true;
    } else {
      showError("Selected character not found.");
      return false;
    }
  } catch (error) {
    showError("Error swapping host: " + error.message);
    console.error("Host swap error:", error);
    return false;
  } finally {
    // Hide loading
    if (loadingElement) {
      loadingElement.style.display = "none";
    }
  }
}

/**
 * Extract inner content from XML tags
 * @param {string} xmlBlock - The complete XML block with tags
 * @param {string} tagName - The tag name (player, farmhand, farmer, Farmer)
 * @returns {string} - The inner content without the wrapper tags
 */
function extractInnerContent(xmlBlock, tagName) {
  if (!xmlBlock || typeof xmlBlock !== 'string') {
    console.error("Invalid xmlBlock provided to extractInnerContent:", xmlBlock);
    return '';
  }
  
  let pattern;
  
  if (tagName === "player") {
    pattern = /<player>([\s\S]*?)<\/player>/;
  } else if (tagName === "farmhand") {
    pattern = /<farmhand>([\s\S]*?)<\/farmhand>/;
  } else if (tagName === "farmer" || tagName === "Farmer") {
    pattern = /<Farmer[^>]*>([\s\S]*?)<\/Farmer>/;
  } else {
    console.error("Unknown tag name:", tagName);
    return xmlBlock;
  }
  
  const match = xmlBlock.match(pattern);
  if (match && match[1] !== undefined) {
    console.log(`Successfully extracted ${tagName} content, length:`, match[1].length);
    return match[1];
  } else {
    console.error(`Could not extract inner content from ${tagName} tag. Block length:`, xmlBlock.length);
    console.error("Pattern used:", pattern);
    console.error("First 200 chars of xmlBlock:", xmlBlock.substring(0, 200));
    return xmlBlock; // Return original block as fallback
  }
}

/**
 * Swap unique IDs between the old host and new host to ensure proper identification
 * @param {string} newHostContent - Inner content that will become the new host
 * @param {string} oldHostContent - Inner content that was the old host
 * @returns {object} - Object with swapped content
 */
function swapPlayerIDs(newHostContent, oldHostContent) {
  console.log("Swapping player IDs between old and new host...");
  
  // Extract unique ID from old host
  const oldHostIdMatch = oldHostContent.match(/<UniqueMultiplayerID>(\d+)<\/UniqueMultiplayerID>/);
  const oldHostId = oldHostIdMatch ? oldHostIdMatch[1] : null;
  
  // Extract unique ID from new host
  const newHostIdMatch = newHostContent.match(/<UniqueMultiplayerID>(\d+)<\/UniqueMultiplayerID>/);
  const newHostId = newHostIdMatch ? newHostIdMatch[1] : null;
  
  console.log("Old host ID:", oldHostId);
  console.log("New host ID:", newHostId);
  
  let swappedNewHostContent = newHostContent;
  let swappedOldHostContent = oldHostContent;
  
  // Swap the UniqueMultiplayerID fields if they exist
  if (oldHostId && newHostId) {
    // Give the new host the old host's ID (usually 0 for the host)
    swappedNewHostContent = newHostContent.replace(
      `<UniqueMultiplayerID>${newHostId}</UniqueMultiplayerID>`,
      `<UniqueMultiplayerID>${oldHostId}</UniqueMultiplayerID>`
    );
    
    // Give the old host (now farmhand) the new host's old ID
    swappedOldHostContent = oldHostContent.replace(
      `<UniqueMultiplayerID>${oldHostId}</UniqueMultiplayerID>`,
      `<UniqueMultiplayerID>${newHostId}</UniqueMultiplayerID>`
    );
    
    console.log("Successfully swapped UniqueMultiplayerID fields");
  } else {
    console.log("UniqueMultiplayerID fields not found or incomplete");
  }
  
  return {
    newHostContent: swappedNewHostContent,
    newFarmhandContent: swappedOldHostContent
  };
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
