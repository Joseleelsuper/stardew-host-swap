/**
 * Stardew Valley Host Swap Tool - File Handler Module
 * Maneja la carga, procesamiento y descarga de archivos
 */

import * as config from './config.js';
import { showError, showMessage } from './utils.js';
import { parseCharacters } from './characterHandler.js';
// No importamos displayCharacters aquí para evitar dependencia circular

/**
 * Manejar la carga de archivos a través de input de archivo
 */
export function handleFileUpload(event) {
  event.preventDefault();

  // Mostrar spinner de carga
  document.getElementById("loading").style.display = "block";

  // Ocultar la sección de resultados cuando se carga un nuevo archivo
  const resultSection = document.getElementById("result-section");
  if (resultSection) {
    resultSection.style.display = "none";
  }

  // Resetear el estado del enlace de descarga
  const downloadLink = document.getElementById("download-link");
  if (downloadLink) {
    downloadLink.style.pointerEvents = "none";
    downloadLink.style.opacity = "0.5";
    downloadLink.href = "#";
    downloadLink.title = "You must change the host first";
  }

  // Obtener el archivo
  const file = event.target.files
    ? event.target.files[0]
    : event.dataTransfer.files[0];

  if (!file || !file.name.endsWith(".zip")) {
    showError(
      "Por favor, sube un archivo .zip que contenga tu carpeta de guardado de Stardew Valley."
    );
    document.getElementById("loading").style.display = "none";
    return;
  }

  // Usar JSZip para extraer el contenido
  const JSZip = window.JSZip;
  const zip = new JSZip();

  zip
    .loadAsync(file)
    .then(function (contents) {
      // Resetear datos
      config.resetData();

      let foundSaveFile = false;

      // Procesar cada archivo en el zip
      const promises = [];

      // Primero, encontrar el patrón de nombre del archivo de guardado
      Object.keys(contents.files).forEach(function (filename) {
        if (
          !contents.files[filename].dir &&
          !filename.includes("_old") &&
          !filename.includes("SaveGameInfo") &&
          !filename.includes("AdditionalCropData")
        ) {
          // Este debería ser el archivo de guardado principal
          config.setSaveFileName(filename.split("/").pop());
          foundSaveFile = true;
        }
      });

      if (!foundSaveFile) {
        throw new Error(
          "Could not find the main save file in the ZIP. Make sure the ZIP contains your Stardew Valley save folder."
        );
      }

      // Extraer los archivos que necesitamos
      Object.keys(contents.files).forEach(function (filename) {
        if (!contents.files[filename].dir) {
          const cleanFileName = filename.split("/").pop();

          // Archivo de guardado principal
          if (cleanFileName === config.saveFileName) {
            const promise = contents.files[filename]
              .async("text")
              .then(function (content) {
                config.updateOriginalFiles("saveGame", content);
                config.updateBackupFiles("saveGame", content);
              });
            promises.push(promise);
          }

          // Archivo SaveGameInfo
          if (cleanFileName === "SaveGameInfo") {
            const promise = contents.files[filename]
              .async("text")
              .then(function (content) {
                config.updateOriginalFiles("saveGameInfo", content);
                config.updateBackupFiles("saveGameInfo", content);
              });
            promises.push(promise);
          }

          // Archivo AdditionalCropData
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
      if (!config.originalFiles.saveGame || !config.originalFiles.saveGameInfo) {
        throw new Error(
          "The ZIP file does not contain the required save files."
        );
      }

      // Analizar archivos de guardado
      const charactersProcessed = parseCharacters();
      
      if (charactersProcessed) {
        // Importar dinámicamente para evitar circular dependencies
        import('./uiController.js').then(ui => {
          console.log("Llamando a displayCharacters desde handleFileUpload");
          ui.displayCharacters();
        });
      }

      // Ocultar el spinner de carga
      document.getElementById("loading").style.display = "none";
    })
    .catch(function (error) {
      console.error("Error processing ZIP file:", error);
      showError(
        error.message ||
          "Error processing ZIP file. Please make sure it contains valid Stardew Valley save files."
      );
      document.getElementById("loading").style.display = "none";
    });
}

/**
 * Manejar la entrada de texto tradicional para compatibilidad
 */
export function handleTextInput(e) {
  const saveGameXml = e.target.value;

  if (!saveGameXml || !saveGameXml.includes("<player>")) {
    return;
  }

  // Ocultar la sección de resultados cuando se introduce nuevo texto
  const resultSection = document.getElementById("result-section");
  if (resultSection) {
    resultSection.style.display = "none";
  }

  config.updateOriginalFiles("saveGame", saveGameXml);
  config.updateBackupFiles("saveGame", saveGameXml);

  // Generar un SaveGameInfo ficticio ya que no tenemos uno
  const dummyInfo = '<Farmer xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"></Farmer>';
  config.updateOriginalFiles("saveGameInfo", dummyInfo);
  config.updateBackupFiles("saveGameInfo", dummyInfo);

  const charactersProcessed = parseCharacters();
  
  if (charactersProcessed) {
    // Importar dinámicamente para evitar circular dependencies
    import('./uiController.js').then(ui => {
      console.log("Llamando a displayCharacters desde handleTextInput");
      ui.displayCharacters();
    });
  }
}

/**
 * Crear archivo ZIP descargable con archivos de guardado modificados
 */
export function createDownload() {
  // Mostrar indicador de carga durante la generación del ZIP
  const loadingElement = document.getElementById("loading");
  if (loadingElement) {
    loadingElement.style.display = "block";
  }

  // Mostrar mensaje informativo
  showMessage(
    "Preparando archivos para descargar... Por favor, espera un momento.",
    "info"
  );

  const JSZip = window.JSZip;
  const zip = new JSZip();

  // Extraer el nombre de la carpeta del archivo de guardado
  const folderName = config.saveFileName.includes("_")
    ? config.saveFileName.split("_")[0]
    : config.saveFileName;
  const folderNameWithSeed = config.saveFileName.split(".")[0]; // Quitamos extensión
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);

  // Añadir carpeta de guardado principal - incluir timestamp para evitar conflictos
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
    // Crear una subcarpeta para los archivos modificados
    const modifiedFolder = saveFolder.folder("modified_files");
    // Crear una subcarpeta para los backups
    const backupFolder = saveFolder.folder("backup_files");
    
    if (!modifiedFolder || !backupFolder) {
      throw new Error("No se pudieron crear las subcarpetas necesarias");
    }

    // Añadir archivos de guardado a la carpeta de modificados
    modifiedFolder.file(config.saveFileName, config.originalFiles.saveGame);
    modifiedFolder.file("SaveGameInfo", config.originalFiles.saveGameInfo);
    if (config.originalFiles.additionalCropData) {
      modifiedFolder.file("AdditionalCropData", config.originalFiles.additionalCropData);
    }

    // Añadir archivos de backup a la carpeta de backups
    backupFolder.file(config.saveFileName, config.backupFiles.saveGame);
    backupFolder.file("SaveGameInfo", config.backupFiles.saveGameInfo);
    if (config.backupFiles.additionalCropData) {
      backupFolder.file("AdditionalCropData", config.backupFiles.additionalCropData);
    }

    // Añadir archivo README con instrucciones
    const readmeContent = `# Stardew Valley Host Swap - Archivos Modificados

## Contenido
Este archivo ZIP contiene:
- /modified_files/ - Archivos con el nuevo host (${config.selectedNewHost}) que debes usar
- /backup_files/ - Copia de seguridad de los archivos originales

## Instrucciones
1. Extrae todo el contenido de la carpeta "modified_files" en tu carpeta de guardado de Stardew Valley
2. El directorio debe ser: ${mainFolderName}
3. Si tienes problemas, puedes restaurar los archivos originales de la carpeta "backup_files"

## Generado el: ${new Date().toLocaleString()}
`;
    
    saveFolder.file("README.txt", readmeContent);

    // Generar archivo ZIP con mejor compresión para archivos de texto
    zip
      .generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 9 // Máximo nivel de compresión
        }
      })
      .then(function (content) {
        const downloadLink = document.getElementById("download-link");
        if (downloadLink) {
          // Revocar cualquier URL anterior para evitar fugas de memoria
          if (downloadLink.href && downloadLink.href.startsWith("blob:")) {
            URL.revokeObjectURL(downloadLink.href);
          }

          // Crear URL para descarga
          const url = URL.createObjectURL(content);
          downloadLink.href = url;
          downloadLink.download = `${mainFolderName}_${timestamp}.zip`;
          downloadLink.style.display = "inline-block";

          // Ocultar indicador de carga
          if (loadingElement) {
            loadingElement.style.display = "none";
          }

          // Añadir evento para mostrar mensaje al descargar
          downloadLink.onclick = function () {
            showMessage(
              "¡Descarga iniciada! Recuerda extraer el contenido de la carpeta 'modified_files' en tu carpeta de guardados de Stardew Valley.",
              "success"
            );
            
            // Programar la revocación de la URL del blob para evitar fugas de memoria
            setTimeout(function() {
              URL.revokeObjectURL(url);
            }, 60000); // Revocar después de 1 minuto
          };
          
          // Notificar que está listo para descargar
          showMessage(
            "¡Archivos listos para descargar! Haz clic en el botón 'Download Modified Files'.",
            "success"
          );
        }
      })
      .catch(function (error) {
        console.error("Error generando ZIP:", error);
        showError(
          "Error al generar el archivo ZIP. Por favor, intenta de nuevo: " + error.message
        );
        if (loadingElement) {
          loadingElement.style.display = "none";
        }
      });
  } catch (error) {
    console.error("Error creating ZIP:", error);
    showError("Error al crear el archivo ZIP: " + error.message);
    if (loadingElement) {
      loadingElement.style.display = "none";
    }
  }
}
