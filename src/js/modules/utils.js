/**
 * Stardew Valley Host Swap Tool - Utils Module
 * Contains general utility functions
 */

/**
 * Show error message
 */
export function showError(message) {
  showMessage(message, "error");
}

/**
 * Show message with a specific type
 */
export function showMessage(message, type) {
  const messageContainer = document.getElementById("message-container");
  if (!messageContainer) {
    return;
  }

  // Clear previous messages
  messageContainer.innerHTML = "";

  const messageElement = document.createElement("div");
  messageElement.className = type;
  messageElement.textContent = message;

  messageContainer.appendChild(messageElement);
}

/**
 * Helper function to isolate the content of an XML tag
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
 * Wait for the DOM to load
 * @param {Function} callback - Function to execute after the DOM is loaded
 */
export function onDOMReady(callback) {
  if (document.readyState !== "loading") {
    callback();
  } else {
    document.addEventListener("DOMContentLoaded", callback);
  }
}

/**
 * Function to copy text to the clipboard
 * @param {string} text - Text to copy
 * @param {string} successMessage - Message to show if the copy was successful
 */
export function copyToClipboard(
  text,
  successMessage = "Text copied to clipboard!"
) {
  // Create a temporary text element
  const tempTextArea = document.createElement("textarea");
  tempTextArea.value = text;
  document.body.appendChild(tempTextArea);

  // Select and copy the text
  tempTextArea.select();
  document.execCommand("copy");

  // Remove the temporary element
  document.body.removeChild(tempTextArea);

  // Show success message
  showMessage(successMessage, "success");
}
