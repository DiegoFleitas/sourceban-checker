import DomParser from "dom-parser";
import SteamId from "steamid";
import localForage from "localforage";

export const performFetch = ({ url, xpath, selectorIndex, selectorText }) => {
  return fetch(url)
    .then((response) => {
      if (!response.ok) {
        console.log(response);
      }
      return response.text();
    })
    .then((decodedText) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(decodedText, "text/html");
      const element = doc
        .evaluate(
          xpath,
          doc,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null
        )
        .snapshotItem(selectorIndex);
      // outerText depends on visibilty
      console.log(url, element?.textContent);
      let banStatus = "Not banned";
      const textToSearch = selectorText || "Permanent";
      if (element?.textContent?.includes(textToSearch)) {
        banStatus = "Banned";
      }
      return banStatus;
    })
    .catch((error) => {
      console.log(error);
      return "fail";
    });
};

export const getSteamId = (player, steamIdType) => {
  /**
   * handles "STEAM_0" vs "STEAM_1" steam2 universe prefix
   * ex: tf2 banlists use "STEAM_0", whereas csgo, l4d2, etc use "STEAM_1"
   * see @https://developer.valvesoftware.com/wiki/SteamID#Universes_Available_for_Steam_Accounts
   */
  if (steamIdType === "steam3") {
    return player.getSteam3RenderedID();
  } else if (steamIdType === "steam2_new") {
    return player.getSteam2RenderedID(true);
  } else {
    // Default to steam2_old
    return player.getSteam2RenderedID();
  }
};

export const isCacheExpired = (timestamp) => {
  const oneWeek = 7 * 24 * 60 * 60 * 1000; // in milliseconds
  const now = Date.now();
  return now - timestamp >= oneWeek;
};
