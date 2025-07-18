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
  // Remove BOM from text before copying
  const cleanText = removeBOM(text);
  
  console.log("Copying content to clipboard, length:", cleanText.length);
  
  // Try modern Clipboard API first (better for large content)
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(cleanText).then(() => {
      console.log("Successfully copied using modern clipboard API");
      showMessage(successMessage, "success");
    }).catch(err => {
      console.error("Modern clipboard API failed, falling back to legacy method:", err);
      fallbackCopy(cleanText, successMessage);
    });
  } else {
    // Fallback to legacy method
    fallbackCopy(cleanText, successMessage);
  }
}

/**
 * Fallback copy method using document.execCommand
 * @param {string} text - Text to copy
 * @param {string} successMessage - Success message
 */
function fallbackCopy(text, successMessage) {
  // Create a temporary text element
  const tempTextArea = document.createElement("textarea");
  tempTextArea.value = text;
  tempTextArea.style.position = "fixed";
  tempTextArea.style.left = "-999999px";
  tempTextArea.style.top = "-999999px";
  document.body.appendChild(tempTextArea);

  // Select and copy the text
  tempTextArea.focus();
  tempTextArea.select();
  
  try {
    const successful = document.execCommand("copy");
    if (successful) {
      console.log("Successfully copied using legacy method");
      showMessage(successMessage, "success");
    } else {
      console.error("Legacy copy method failed");
      showError("Failed to copy content to clipboard");
    }
  } catch (err) {
    console.error("Error in legacy copy method:", err);
    showError("Failed to copy content to clipboard");
  }

  // Remove the temporary element
  document.body.removeChild(tempTextArea);
}

/**
 * Remove BOM (Byte Order Mark) from text content
 * Removes the UTF-8 BOM character (﻿) that can appear at the beginning of files
 * @param {string} text - Text content that may contain BOM
 * @returns {string} - Text with BOM removed
 */
export function removeBOM(text) {
  if (typeof text !== 'string') {
    return text;
  }
  
  // UTF-8 BOM is 0xEF 0xBB 0xBF, which appears as ﻿ in JavaScript strings
  // Check if the text starts with BOM character
  if (text.charCodeAt(0) === 0xFEFF) {
    console.log("BOM detected and removed from content");
    return text.slice(1);
  }
  
  // Also check for the visible BOM character that sometimes appears
  if (text.startsWith('﻿')) {
    console.log("Visible BOM character detected and removed from content");
    return text.substring(1);
  }
  
  return text;
}
