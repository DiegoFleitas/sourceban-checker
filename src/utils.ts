import SteamId from "steamid";
import type { BanResult, PerformFetchOptions, SteamIdType } from "./types";

/**
 * Same-origin relay endpoint (Netlify Function) used for ban pages that do not
 * send CORS headers. It validates the target against a SourceBans allowlist, so
 * the browser never talks to an arbitrary host.
 */
export const RELAY_PATH = "/.netlify/functions/relay";

/** Wraps an absolute upstream URL in the same-origin relay endpoint. */
export function buildRelayUrl(targetUrl: string): string {
  return `${RELAY_PATH}?url=${encodeURIComponent(targetUrl)}`;
}

/** Recovers the upstream URL previously wrapped by buildRelayUrl. */
export function extractTargetUrl(relayedUrl: string | null): string {
  if (!relayedUrl) return "";
  const prefix = `${RELAY_PATH}?url=`;
  if (!relayedUrl.startsWith(prefix)) return relayedUrl;
  try {
    return decodeURIComponent(relayedUrl.slice(prefix.length));
  } catch {
    return relayedUrl;
  }
}

export function performFetch({
  url,
  xpath,
  selectorIndex,
  selectorText,
}: PerformFetchOptions): Promise<BanResult> {
  return fetch(url)
    .then((response) => {
      // The relay marks its own failures (bad target, timeout, non-HTML
      // upstream). Those are infrastructure problems, not a ban-page answer, so
      // they surface as "error" instead of the fail-closed "fail" used for
      // unexpected upstream responses.
      if (response.headers?.get?.("x-relay-error")) {
        return "error" as BanResult;
      }
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
      // Transport failure (relay down, DNS failure, offline). Surfacing this as
      // "error" keeps a relay outage visible instead of masquerading as a
      // scraping bug on every single server.
      return "error" as BanResult;
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
