/**
 * Stardew Valley Host Swap Tool - Utils Module
 * Contiene funciones de utilidad generales
 */

/**
 * Mostrar mensaje de error
 */
export function showError(message) {
  showMessage(message, "error");
}

/**
 * Mostrar mensaje con tipo específico
 */
export function showMessage(message, type) {
  const messageContainer = document.getElementById("message-container");
  if (!messageContainer) {
    console.log(`${type}: ${message}`);
    return;
  }

  // Limpiar mensajes anteriores
  messageContainer.innerHTML = "";

  const messageElement = document.createElement("div");
  messageElement.className = type;
  messageElement.textContent = message;

  messageContainer.appendChild(messageElement);
}

/**
 * Función auxiliar para aislar el contenido de una etiqueta XML
 */
export function isolateTag(string, tag) {
  var startIndex = string.indexOf("<" + tag + ">");
  var endIndex = string.indexOf("</" + tag + ">") + tag.length + 3;
  var noContents = false;
  
  if (startIndex === -1) {
    startIndex = string.indexOf("<" + tag + "/>" + tag.length + 3);
    noContents = true;
    endIndex = startIndex;
  }
  
  if (startIndex === -1) {
    return string; // malformed
  }
  
  var beforeTag = string.substring(0, startIndex) + "<" + tag + ">";
  var contents = noContents
    ? ""
    : string.substring(startIndex + tag.length + 2, endIndex - tag.length - 3);
  var afterTag = "</" + tag + ">" + string.substring(endIndex);
  
  return [beforeTag, contents, afterTag];
}

/**
 * Esperar a que se cargue el DOM
 * @param {Function} callback - Función a ejecutar después de cargado el DOM
 */
export function onDOMReady(callback) {
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

/**
 * Función para copiar texto al portapapeles
 * @param {string} text - Texto a copiar
 * @param {string} successMessage - Mensaje a mostrar si la copia fue exitosa
 */
export function copyToClipboard(text, successMessage = "¡Texto copiado al portapapeles!") {
  // Crear un elemento de texto temporal
  const tempTextArea = document.createElement("textarea");
  tempTextArea.value = text;
  document.body.appendChild(tempTextArea);
  
  // Seleccionar y copiar el texto
  tempTextArea.select();
  document.execCommand("copy");
  
  // Eliminar el elemento temporal
  document.body.removeChild(tempTextArea);
  
  // Mostrar mensaje de éxito
  showMessage(successMessage, "success");
}
