/**
 * Stardew Valley Host Swap Tool - Main Module
 * Main entry point for the application
 */

import { onDOMReady } from "./utils.js";
import { handleFileUpload, handleTextInput } from "./fileHandler.js";
import {
  setupUIEventListeners,
  copyToClipboardLegacy,
  legacySwap,
  displayCharacters,
} from "./uiController.js";
import {
  selectNewHost,
  swapHost,
  parseCharacters,
} from "./characterHandler.js";

/**
 * Initialize the application
 */
function init() {
  // Prepare initial interface
  const characterSection = document.getElementById("character-section");
  const resultSection = document.getElementById("result-section");
  const downloadLink = document.getElementById("download-link");

  // Configure elements if they exist
  if (resultSection) {
    // Hide results area until host change is completed
    resultSection.style.display = "none";

    if (downloadLink) {
      downloadLink.style.pointerEvents = "none";
      downloadLink.style.opacity = "0.5";
      downloadLink.href = "#";
      downloadLink.title = "You must process a file and change the host first";
    }
  }

  // Check if we're using the new UI
  const fileInput = document.getElementById("file-input");
  if (fileInput) {
    // Ensure the event is assigned directly
    fileInput.addEventListener("change", function (event) {
      // Call the imported function correctly
      handleFileUpload(event);

      // Also ensure characters are displayed after processing the file
      setTimeout(() => {
        import("./characterHandler.js").then((ch) => {
          import("./uiController.js").then((ui) => {
            ui.displayCharacters();
          });
        });
      }, 1000); // Small delay to ensure processing is complete
    });

    // Set up the rest of UI event listeners
    setupUIEventListeners();
  }

  // Check for legacy text input
  const textInput = document.getElementById("input");
  if (textInput) {
    textInput.addEventListener("input", function (event) {
      handleTextInput(event);
    });
  }
}

// Expose functions needed for legacy code compatibility
window.setCharacters = handleTextInput;
window.copy = copyToClipboardLegacy;
window.legacySwap = legacySwap;
window.selectNewHost = selectNewHost;
window.swapHost = swapHost;
window.parseCharacters = parseCharacters;
window.displayCharacters = displayCharacters;

// Initialize when DOM loads - using both methods for better compatibility
document.addEventListener("DOMContentLoaded", init);

// Also use onDOMReady as backup
onDOMReady(init);
