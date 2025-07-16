/**
 * Stardew Valley Host Swap Tool - UI Controller Module
 * Controla la interfaz de usuario
 */

import * as config from './config.js';
import { showMessage, showError, copyToClipboard } from './utils.js';
import { selectNewHost, swapHost } from './characterHandler.js';
import { createDownload, handleFileUpload } from './fileHandler.js';

/**
 * Mostrar personajes en la UI
 */
export function displayCharacters() {
  console.log("Mostrando personajes en la UI...");
  console.log("Host:", config.hostCharacter);
  console.log("Farmhands:", config.farmhands);
  
  const characterSection = document.getElementById("character-section");
  if (!characterSection) {
    console.log("No se encontró el elemento character-section, usando legacy UI");
    // Versión antigua de UI
    displayCharactersLegacy();
    return;
  }
  
  console.log("Elemento character-section encontrado, mostrando personajes en la UI moderna");

  characterSection.style.display = "block";
  console.log("Mostrando sección de caracteres (display: block)");

  const characterList = document.getElementById("character-list");
  if (!characterList) {
    console.error("No se encontró el elemento character-list");
    return;
  }
  
  console.log("Limpiando la lista de caracteres");
  characterList.innerHTML = "";

  // Añadir personaje host
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

  // Añadir personajes ayudantes
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

  // Habilitar botón de intercambio si hay ayudantes
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
 * Mostrar personajes en la UI heredada
 */
export function displayCharactersLegacy() {
  // Para compatibilidad con la interfaz original
  let players = [];
  let hostName = "";

  if (config.hostCharacter) {
    hostName = config.hostCharacter.name;
  }

  // Solo añadimos farmhands a la lista de seleccionables
  config.farmhands.forEach((farmhand, index) => {
    // Comenzar los índices de ayudantes en 3, ya que 1 es host y 2 está reservado para los datos del host
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
    // Mostrar el host actual
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
 * Función de intercambio para la UI heredada
 */
export function legacySwap(characterName) {
  selectNewHost(characterName);
  
  if (swapHost()) {
    // Mostrar en el estilo de UI antiguo
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

    // Mostrar un botón para copiar el contenido
    const copyButton = document.querySelector(".legacy-section .download-button");
    if (copyButton) {
      copyButton.style.display = "inline-block";
    }
  }
}

/**
 * Manejar el clic en el botón de intercambio
 */
export function handleSwapButtonClick() {
  if (swapHost()) {
    // Mostrar la sección de resultados y habilitar el enlace de descarga
    const resultSection = document.getElementById("result-section");
    if (resultSection) {
      resultSection.style.display = "block";
    }

    const downloadLink = document.getElementById("download-link");
    if (downloadLink) {
      downloadLink.style.pointerEvents = "auto";
      downloadLink.style.opacity = "1";
      downloadLink.title = "Haz clic para descargar el archivo modificado";
    }

    // Crear descarga
    createDownload();

    showMessage(
      `¡Host cambiado exitosamente a ${config.selectedNewHost}!`,
      "success"
    );
  }
}

/**
 * Configurar listeners de eventos UI
 */
export function setupUIEventListeners() {
  // Configurar el comportamiento de la zona de soltar
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
      console.log("Evento drop activado");
      
      // Usar la función importada directamente
      handleFileUpload(e);
    });
  }

  // Configurar botón de intercambio
  const swapButton = document.getElementById("swap-button");
  if (swapButton) {
    swapButton.addEventListener("click", handleSwapButtonClick);
  }
}

/**
 * Función para compatibilidad hacia atrás
 */
export function copyToClipboardLegacy() {
  // Copiar el archivo de guardado modificado al portapapeles desde originalFiles 
  // en lugar de usar el textarea de salida eliminado
  if (config.originalFiles.saveGame) {
    copyToClipboard(config.originalFiles.saveGame, "Modified save file copied to clipboard!");
  }
}
