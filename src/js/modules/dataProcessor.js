/**
 * Stardew Valley Host Swap Tool - Data Processor Module
 * Processes and manipulates data from save files
 */

import * as config from "./config.js";
import { isolateTag } from "./utils.js";

export function fixHostData(newHostData, originalHostData) {
  let fixedData = newHostData;

  fixedData = fixMail(fixedData, originalHostData);

  fixedData = fixEvents(fixedData, originalHostData);

  fixedData = fixUpgradeLevels(fixedData, originalHostData);

  fixedData = fixHomeLocation(
    fixedData,
    "<homeLocation>FarmHouse</homeLocation>"
  );

  return fixedData;
}

export function fixMail(newHostString, originalHostString) {
  const newHostParts = isolateTag(newHostString, "mailReceived");
  const originalHostParts = isolateTag(originalHostString, "mailReceived");

  const newHostMail = newHostParts[1];
  const oldHostMail = originalHostParts[1];
  let mailString = newHostMail;

  // Mail that all players should share
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

export function fixHomeLocation(dest, source) {
  const destParts = isolateTag(dest, "homeLocation");
  const sourceParts = isolateTag(source, "homeLocation");
  return destParts[0] + sourceParts[1] + destParts[2];
}

export function fixUpgradeLevels(dest, source) {
  let result = dest;

  const destHouseParts = isolateTag(dest, "houseUpgradeLevel");
  const sourceHouseParts = isolateTag(source, "houseUpgradeLevel");
  result = destHouseParts[0] + sourceHouseParts[1] + destHouseParts[2];

  const destDaysParts = isolateTag(result, "daysUntilHouseUpgrade");
  const sourceDaysParts = isolateTag(source, "daysUntilHouseUpgrade");
  return destDaysParts[0] + sourceDaysParts[1] + destDaysParts[2];
}

export function fixEvents(newHostString, originalHostString) {
  const newHostParts = isolateTag(newHostString, "eventsSeen");
  const originalHostParts = isolateTag(originalHostString, "eventsSeen");

  const newHostEvents = newHostParts[1];
  const oldHostEvents = originalHostParts[1];
  let eventsString = newHostEvents;

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
