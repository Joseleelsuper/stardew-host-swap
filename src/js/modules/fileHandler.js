/**
 * Stardew Valley Host Swap Tool - File Handler Module
 */

import * as config from "./config.js";
import { showError, showMessage } from "./utils.js";
import { parseCharacters } from "./characterHandler.js";

/**
 * Handle file upload via file input
 */
export function handleFileUpload(event) {
  event.preventDefault();

  // Show loading spinner
  document.getElementById("loading").style.display = "block";

  // Hide the results section when a new file is loaded
  const resultSection = document.getElementById("result-section");
  if (resultSection) {
    resultSection.style.display = "none";
  }

  // Reset the download link state
  const downloadLink = document.getElementById("download-link");
  if (downloadLink) {
    downloadLink.style.pointerEvents = "none";
    downloadLink.style.opacity = "0.5";
    downloadLink.href = "#";
    downloadLink.title = "You must change the host first";
  }

  // Get the file
  const file = event.target.files
    ? event.target.files[0]
    : event.dataTransfer.files[0];

  if (!file || !file.name.endsWith(".zip")) {
    showError(
      "Please upload a .zip file containing your Stardew Valley save folder."
    );
    document.getElementById("loading").style.display = "none";
    return;
  }

  // Use JSZip to extract the content
  const JSZip = window.JSZip;
  const zip = new JSZip();

  zip
    .loadAsync(file)
    .then(function (contents) {
      // Reset data
      config.resetData();

      let foundSaveFile = false;

      // Process each file in the zip
      const promises = [];

      // First, find the save file name pattern
      Object.keys(contents.files).forEach(function (filename) {
        if (
          !contents.files[filename].dir &&
          !filename.includes("_old") &&
          !filename.includes("SaveGameInfo") &&
          !filename.includes("AdditionalCropData")
        ) {
          // This should be the main save file
          config.setSaveFileName(filename.split("/").pop());
          foundSaveFile = true;
        }
      });

      if (!foundSaveFile) {
        throw new Error(
          "Could not find the main save file in the ZIP. Make sure the ZIP contains your Stardew Valley save folder."
        );
      }

      // Extract the files we need
      Object.keys(contents.files).forEach(function (filename) {
        if (!contents.files[filename].dir) {
          const cleanFileName = filename.split("/").pop();

          // Main save file
          if (cleanFileName === config.saveFileName) {
            const promise = contents.files[filename]
              .async("text")
              .then(function (content) {
                config.updateOriginalFiles("saveGame", content);
                config.updateBackupFiles("saveGame", content);
              });
            promises.push(promise);
          }

          // SaveGameInfo file
          if (cleanFileName === "SaveGameInfo") {
            const promise = contents.files[filename]
              .async("text")
              .then(function (content) {
                config.updateOriginalFiles("saveGameInfo", content);
                config.updateBackupFiles("saveGameInfo", content);
              });
            promises.push(promise);
          }

          // AdditionalCropData file
          if (cleanFileName === "AdditionalCropData") {
            const promise = contents.files[filename]
              .async("text")
              .then(function (content) {
                config.updateOriginalFiles("additionalCropData", content);
                config.updateBackupFiles("additionalCropData", content);
              });
            promises.push(promise);
          }
        }
      });

      return Promise.all(promises);
    })
    .then(function () {
      if (
        !config.originalFiles.saveGame ||
        !config.originalFiles.saveGameInfo
      ) {
        throw new Error(
          "The ZIP file does not contain the required save files."
        );
      }

      // Parse save files
      const charactersProcessed = parseCharacters();

      if (charactersProcessed) {
        // Dynamically import to avoid circular dependencies
        import("./uiController.js").then((ui) => {
          ui.displayCharacters();
        });
      }

      // Hide the loading spinner
      document.getElementById("loading").style.display = "none";
    })
    .catch(function (error) {
      showError(
        error.message ||
          "Error processing ZIP file. Please make sure it contains valid Stardew Valley save files."
      );
      document.getElementById("loading").style.display = "none";
    });
}

/**
 * Handle traditional text input for compatibility
 */
export function handleTextInput(e) {
  const saveGameXml = e.target.value;

  if (!saveGameXml || !saveGameXml.includes("<player>")) {
    return;
  }

  // Hide the results section when new text is entered
  const resultSection = document.getElementById("result-section");
  if (resultSection) {
    resultSection.style.display = "none";
  }

  config.updateOriginalFiles("saveGame", saveGameXml);
  config.updateBackupFiles("saveGame", saveGameXml);

  // Generate a dummy SaveGameInfo since we don't have one
  const dummyInfo =
    '<Farmer xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"></Farmer>';
  config.updateOriginalFiles("saveGameInfo", dummyInfo);
  config.updateBackupFiles("saveGameInfo", dummyInfo);

  const charactersProcessed = parseCharacters();

  if (charactersProcessed) {
    // Dynamically import to avoid circular dependencies
    import("./uiController.js").then((ui) => {
      ui.displayCharacters();
    });
  }
}

/**
 * Create a downloadable ZIP file with modified save files
 */
export function createDownload() {
  // Show loading indicator while generating the ZIP
  const loadingElement = document.getElementById("loading");
  if (loadingElement) {
    loadingElement.style.display = "block";
  }

  // Show informational message
  showMessage("Preparing files for download... Please wait a moment.", "info");

  const JSZip = window.JSZip;
  const zip = new JSZip();

  // Extract the folder name from the save file
  const folderName = config.saveFileName.includes("_")
    ? config.saveFileName.split("_")[0]
    : config.saveFileName;
  const folderNameWithSeed = config.saveFileName.split(".")[0]; // Remove extension
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .substring(0, 19);

  // Add main save folder - include timestamp to avoid conflicts
  const mainFolderName = `${folderNameWithSeed}_modified`;
  const saveFolder = zip.folder(mainFolderName);

  if (!saveFolder) {
    showError("Error creating ZIP folder structure");
    if (loadingElement) {
      loadingElement.style.display = "none";
    }
    return;
  }

  try {
    // Create a subfolder for the modified files
    const modifiedFolder = saveFolder.folder("modified_files");
    // Create a subfolder for the backups
    const backupFolder = saveFolder.folder("backup_files");

    if (!modifiedFolder || !backupFolder) {
      throw new Error("Could not create necessary subfolders");
    }

    // Add save files to the modified folder
    modifiedFolder.file(config.saveFileName, config.originalFiles.saveGame);
    modifiedFolder.file("SaveGameInfo", config.originalFiles.saveGameInfo);
    if (config.originalFiles.additionalCropData) {
      modifiedFolder.file(
        "AdditionalCropData",
        config.originalFiles.additionalCropData
      );
    }

    // Add backup files to the backup folder
    backupFolder.file(config.saveFileName, config.backupFiles.saveGame);
    backupFolder.file("SaveGameInfo", config.backupFiles.saveGameInfo);
    if (config.backupFiles.additionalCropData) {
      backupFolder.file(
        "AdditionalCropData",
        config.backupFiles.additionalCropData
      );
    }

    // Add README file with instructions
    const readmeContent = `# Stardew Valley Host Swap - Modified Files

## Contents
This ZIP file contains:
- /modified_files/ - Files with the new host (${
      config.selectedNewHost
    }) that you should use
- /backup_files/ - Backup of the original files

## Instructions
1. Extract all the contents of the "modified_files" folder into your Stardew Valley save folder
2. The directory should be: ${mainFolderName}
3. If you have problems, you can restore the original files from the "backup_files" folder

## Generated on: ${new Date().toLocaleString()}
`;

    saveFolder.file("README.txt", readmeContent);

    // Generate ZIP file with better compression for text files
    zip
      .generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 9, // Maximum compression level
        },
      })
      .then(function (content) {
        const downloadLink = document.getElementById("download-link");
        if (downloadLink) {
          // Revoke any previous URL to avoid memory leaks
          if (downloadLink.href && downloadLink.href.startsWith("blob:")) {
            URL.revokeObjectURL(downloadLink.href);
          }

          // Create URL for download
          const url = URL.createObjectURL(content);
          downloadLink.href = url;
          downloadLink.download = `${mainFolderName}_${timestamp}.zip`;
          downloadLink.style.display = "inline-block";

          // Hide loading indicator
          if (loadingElement) {
            loadingElement.style.display = "none";
          }

          // Add event to show message on download
          downloadLink.onclick = function () {
            showMessage(
              "Download started! Remember to extract the contents of the 'modified_files' folder into your Stardew Valley saves folder.",
              "success"
            );

            // Schedule revocation of the blob URL to prevent memory leaks
            setTimeout(function () {
              URL.revokeObjectURL(url);
            }, 60000); // Revoke after 1 minute
          };

          // Notify that it's ready to download
          showMessage(
            "Files are ready to download! Click the 'Download Modified Files' button.",
            "success"
          );
        }
      })
      .catch(function (error) {
        showError(
          "Error generating the ZIP file. Please try again: " + error.message
        );
        if (loadingElement) {
          loadingElement.style.display = "none";
        }
      });
  } catch (error) {
    showError("Error creating the ZIP file: " + error.message);
    if (loadingElement) {
      loadingElement.style.display = "none";
    }
  }
}
