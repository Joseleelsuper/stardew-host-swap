/**
 * Stardew Valley Host Swap Tool - Character Handler Module
 * Procesa y maneja los personajes de los archivos de guardado
 */

import * as config from './config.js';
import { showError, showMessage } from './utils.js';
import { fixHostData } from './dataProcessor.js';

/**
 * Analizar personajes del archivo de guardado
 */
export function parseCharacters() {
  try {
    console.log("Analizando personajes del archivo de guardado...");
    
    const saveGameXml = config.originalFiles.saveGame;
    
    if (!saveGameXml) {
      console.error("Error: No hay contenido en saveGameXml");
      showError("No se encontró contenido en el archivo de guardado. Por favor, intenta cargarlo nuevamente.");
      return false;
    }
    
    // Añadir un registro para depuración
    console.log("Contenido de saveGameXml:", saveGameXml.substring(0, 100) + "...");

    // Resetear datos de personajes
    config.setHostCharacter(null);
    config.setFarmhands([]);

    // Analizar el personaje host (etiqueta player)
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

    // Analizar ayudantes (farmhands)
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

    // Comprobar también las etiquetas Farmer (en caso de estructura XML diferente)
    if (hands.length === 0) {
      const farmerPattern = /<Farmer>([\s\S]*?)<\/Farmer>/g;
      let farmerMatch;

      while ((farmerMatch = farmerPattern.exec(saveGameXml)) !== null) {
        // Omitir si esta es la etiqueta Farmer del host (dentro de la etiqueta player)
        if (config.hostCharacter && config.hostCharacter.content.includes(farmerMatch[0])) {
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

    // Mostrar personajes - importamos aquí para evitar referencia circular
    import('./uiController.js').then(ui => {
      console.log("Llamando a displayCharacters después de analizar los personajes");
      ui.displayCharacters();
    });
    
    return true;
  } catch (error) {
    console.error("Error parsing characters:", error);
    showError(
      "Error parsing save file. The file might be corrupted or in an unsupported format."
    );
    return false;
  }
}

/**
 * Seleccionar un nuevo host
 */
export function selectNewHost(name) {
  config.setSelectedNewHost(name);

  // Actualizar UI para mostrar la selección
  const characterCards = document.querySelectorAll(".character-card");
  characterCards.forEach((card) => {
    if (card.dataset.name === name) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });

  // Habilitar botón de intercambio
  const swapButton = document.getElementById("swap-button");
  if (swapButton) {
    swapButton.disabled = false;
  }
}

/**
 * Realizar el intercambio de host
 */
export function swapHost() {
  if (!config.selectedNewHost) {
    showError("Please select a new host first.");
    return;
  }

  // Mostrar carga si está disponible
  const loadingElement = document.getElementById("loading");
  if (loadingElement) {
    loadingElement.style.display = "block";
  }

  try {
    let newSaveGameXml = config.originalFiles.saveGame;
    let newSaveGameInfoXml = config.originalFiles.saveGameInfo;

    // Si se selecciona el host actual, no se necesitan cambios
    if (config.hostCharacter && config.selectedNewHost === config.hostCharacter.name) {
      showMessage("The selected character is already the host.", "info");
      if (loadingElement) {
        loadingElement.style.display = "none";
      }
      return;
    }

    // Encontrar el ayudante seleccionado
    const selectedFarmhand = config.farmhands.find(
      (fh) => fh.name === config.selectedNewHost
    );

    if (selectedFarmhand && config.hostCharacter) {
      // Extraer datos necesarios
      const hostData = config.hostCharacter.content;
      const farmhandData = selectedFarmhand.content;

      // Convertir host a ayudante
      const newFarmhandData = hostData
        .replace(/<player>/g, "<farmhand>")
        .replace(/<\/player>/g, "</farmhand>");

      // Convertir ayudante a host
      const newHostData = farmhandData
        .replace(/<farmhand>/g, "<player>")
        .replace(/<\/farmhand>/g, "</player>");

      // Arreglar correo, eventos y niveles de actualización de casa
      const fixedNewHostData = fixHostData(newHostData, hostData);

      // Crear nuevo XML de juego guardado reemplazando el contenido
      newSaveGameXml = newSaveGameXml.replace(hostData, fixedNewHostData);
      newSaveGameXml = newSaveGameXml.replace(farmhandData, newFarmhandData);

      // Actualizar SaveGameInfo para contener información del nuevo host
      // Extraer etiqueta Farmer de los datos del nuevo host
      const farmerMatch = fixedNewHostData.match(
        /<Farmer>([\s\S]*?)<\/Farmer>/i
      );
      if (farmerMatch) {
        const farmerData = farmerMatch[0];

        // SaveGameInfo contiene una etiqueta Farmer con atributos de espacio de nombres XML
        const xmlnsPattern =
          /<Farmer xmlns:xsi="http:\/\/www\.w3\.org\/2001\/XMLSchema-instance" xmlns:xsd="http:\/\/www\.w3\.org\/2001\/XMLSchema">([\s\S]*?)<\/Farmer>/;
        const saveGameInfoMatch =
          config.originalFiles.saveGameInfo.match(xmlnsPattern);

        if (saveGameInfoMatch) {
          // Mantener los atributos de espacio de nombres XML pero reemplazar el contenido
          const farmerContent = farmerData
            .replace(/<Farmer>/i, "")
            .replace(/<\/Farmer>/i, "");
          newSaveGameInfoXml = config.originalFiles.saveGameInfo.replace(
            xmlnsPattern,
            `<Farmer xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">${farmerContent}</Farmer>`
          );
        }
      }

      // Actualizar variables globales con nuevo contenido
      config.updateOriginalFiles("saveGame", newSaveGameXml);
      config.updateOriginalFiles("saveGameInfo", newSaveGameInfoXml);

      return true;
    } else {
      showError("Selected character not found.");
      return false;
    }
  } catch (error) {
    console.error("Error swapping host:", error);
    showError("Error swapping host: " + error.message);
    return false;
  } finally {
    // Ocultar carga
    if (loadingElement) {
      loadingElement.style.display = "none";
    }
  }
}
