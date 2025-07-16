/**
 * Stardew Valley Host Swap Tool - Data Processor Module
 * Procesa y manipula los datos de los archivos de guardado
 */

import * as config from './config.js';
import { isolateTag } from './utils.js';

/**
 * Arreglar datos del host transfiriendo información importante del host original
 */
export function fixHostData(newHostData, originalHostData) {
  let fixedData = newHostData;

  // Arreglar el correo
  fixedData = fixMail(fixedData, originalHostData);

  // Arreglar eventos
  fixedData = fixEvents(fixedData, originalHostData);

  // Arreglar niveles de actualización
  fixedData = fixUpgradeLevels(fixedData, originalHostData);

  // Arreglar ubicación de casa
  fixedData = fixHomeLocation(
    fixedData,
    "<homeLocation>FarmHouse</homeLocation>"
  );

  return fixedData;
}

/**
 * Arreglar el correo en el archivo de guardado
 */
export function fixMail(newHostString, originalHostString) {
  const newHostParts = isolateTag(newHostString, "mailReceived");
  const originalHostParts = isolateTag(originalHostString, "mailReceived");

  const newHostMail = newHostParts[1];
  const oldHostMail = originalHostParts[1];
  let mailString = newHostMail;

  // Correo que todos los jugadores deben compartir
  for (let i = 0; i < config.TRANSFERRABLE_MAIL.length; i++) {
    if (
      oldHostMail.includes(config.TRANSFERRABLE_MAIL[i]) &&
      !newHostMail.includes(config.TRANSFERRABLE_MAIL[i])
    ) {
      mailString += config.TRANSFERRABLE_MAIL[i];
    }
  }

  return newHostParts[0] + mailString + newHostParts[2];
}

/**
 * Arreglar ubicación de casa en el archivo de guardado
 */
export function fixHomeLocation(dest, source) {
  const destParts = isolateTag(dest, "homeLocation");
  const sourceParts = isolateTag(source, "homeLocation");
  return destParts[0] + sourceParts[1] + destParts[2];
}

/**
 * Arreglar niveles de actualización de casa en el archivo de guardado
 */
export function fixUpgradeLevels(dest, source) {
  let result = dest;
  
  const destHouseParts = isolateTag(dest, "houseUpgradeLevel");
  const sourceHouseParts = isolateTag(source, "houseUpgradeLevel");
  result = destHouseParts[0] + sourceHouseParts[1] + destHouseParts[2];
  
  const destDaysParts = isolateTag(result, "daysUntilHouseUpgrade");
  const sourceDaysParts = isolateTag(source, "daysUntilHouseUpgrade");
  return destDaysParts[0] + sourceDaysParts[1] + destDaysParts[2];
}

/**
 * Arreglar eventos en el archivo de guardado
 */
export function fixEvents(newHostString, originalHostString) {
  const newHostParts = isolateTag(newHostString, "eventsSeen");
  const originalHostParts = isolateTag(originalHostString, "eventsSeen");

  const newHostEvents = newHostParts[1];
  const oldHostEvents = originalHostParts[1];
  let eventsString = newHostEvents;

  // Eventos que todos los jugadores deben compartir
  for (let i = 0; i < config.TRANSFERRABLE_EVENTS.length; i++) {
    if (
      oldHostEvents.includes(config.TRANSFERRABLE_EVENTS[i]) &&
      !newHostEvents.includes(config.TRANSFERRABLE_EVENTS[i])
    ) {
      eventsString += config.TRANSFERRABLE_EVENTS[i];
    }
  }

  return newHostParts[0] + eventsString + newHostParts[2];
}
