import SteamId from "steamid";
import type { BanResult, PerformFetchOptions, SteamIdType } from "./types";

export function performFetch({
  url,
  xpath,
  selectorIndex,
  selectorText,
}: PerformFetchOptions): Promise<BanResult> {
  return fetch(url)
    .then((response) => {
      const contentType = response.headers?.get?.("content-type");
      if (!response.ok || (contentType && !contentType.includes("text/html"))) {
        return "fail" as BanResult;
      }
      return response.text().then((decodedText) => {
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
        let banStatus: BanResult = "Not banned";
        const textToSearch = selectorText || "Permanent";
        if (element?.textContent?.includes(textToSearch)) {
          banStatus = "Banned";
        }
        return banStatus;
      });
    })
    .catch(() => {
      return "fail" as BanResult;
    });
}

export function getSteamId(player: SteamId, steamIdType?: SteamIdType): string {
  if (steamIdType === "steam3") {
    return player.getSteam3RenderedID();
  }
  if (steamIdType === "steam2_new") {
    return player.getSteam2RenderedID(true);
  }
  return player.getSteam2RenderedID();
}

export function isCacheExpired(timestamp: number): boolean {
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  return now - timestamp >= oneWeek;
}
