/**
 * Stardew Valley Host Swap Tool - Main Module
 * Punto de entrada principal para la aplicación
 */

import { onDOMReady } from './utils.js';
import { handleFileUpload, handleTextInput } from './fileHandler.js';
import { setupUIEventListeners, copyToClipboardLegacy, legacySwap, displayCharacters } from './uiController.js';
import { selectNewHost, swapHost, parseCharacters } from './characterHandler.js';

/**
 * Inicializar la aplicación
 */
function init() {
  console.log("Inicializando aplicación Stardew Valley Host Swap Tool...");
  // Preparar la interfaz inicial
  const characterSection = document.getElementById("character-section");
  const resultSection = document.getElementById("result-section");
  const downloadLink = document.getElementById("download-link");

  // Si existen estos elementos, los configuramos inicialmente
  if (resultSection) {
    // Ocultar el área de resultados hasta que se complete un cambio de host
    resultSection.style.display = "none";

    if (downloadLink) {
      downloadLink.style.pointerEvents = "none";
      downloadLink.style.opacity = "0.5";
      downloadLink.href = "#";
      downloadLink.title =
        "Primero debes procesar un archivo y cambiar el host";
    }
  }

  // Comprobar si estamos usando la nueva UI
  const fileInput = document.getElementById("file-input");
  if (fileInput) {
    // Asegurarnos de que el evento se asigne directamente
    console.log("Asignando evento change al input de archivo");
    fileInput.addEventListener("change", function(event) {
      console.log("Evento change del input de archivo activado");
      
      // Esto debería llamar a la función importada correctamente
      handleFileUpload(event);
      
      // También asegurarnos de que se muestren los personajes después de procesar el archivo
      setTimeout(() => {
        import('./characterHandler.js').then(ch => {
          console.log("Verificando que los personajes fueron analizados después de cargar el archivo");
          import('./uiController.js').then(ui => {
            ui.displayCharacters();
          });
        });
      }, 1000); // Pequeño retraso para asegurar que el procesamiento se complete
    });
    
    // Configurar el resto de listeners de eventos UI
    setupUIEventListeners();
  }

  // Comprobar para entrada de texto heredada
  const textInput = document.getElementById("input");
  if (textInput) {
    console.log("Asignando evento input al textarea");
    textInput.addEventListener("input", function(event) {
      console.log("Evento input del textarea activado");
      handleTextInput(event);
    });
  }
  
  console.log("Inicialización completada - UI preparada");
}

// Exponer funciones necesarias para compatibilidad con código heredado
window.setCharacters = handleTextInput;
window.copy = copyToClipboardLegacy;
window.legacySwap = legacySwap;
window.selectNewHost = selectNewHost;
window.swapHost = swapHost;
window.parseCharacters = parseCharacters;
window.displayCharacters = displayCharacters;

// Inicializar cuando se cargue el DOM - usando ambos métodos para mayor compatibilidad
document.addEventListener('DOMContentLoaded', init);

// También usar onDOMReady como respaldo
onDOMReady(init);
