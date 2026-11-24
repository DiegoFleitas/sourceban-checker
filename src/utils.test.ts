import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildRelayUrl,
  extractTargetUrl,
  getSteamId,
  isCacheExpired,
  performFetch,
  RELAY_PATH,
} from "./utils";
import SteamId from "steamid";

describe("relay URL helpers", () => {
  it("builds a same-origin relay URL with the target percent-encoded", () => {
    const target =
      "https://www.skial.com/sourcebans/index.php?p=banlist&advSearch=STEAM_0:1:64716503";

    const relayed = buildRelayUrl(target);

    expect(RELAY_PATH).toBe("/.netlify/functions/relay");
    expect(relayed.startsWith(`${RELAY_PATH}?url=`)).toBe(true);
    // The upstream '?' and '&' must not leak into the relay query string.
    expect(relayed.split("?")).toHaveLength(2);
    expect(relayed).toContain(encodeURIComponent(target));
    expect(new URLSearchParams(relayed.split("?")[1]).get("url")).toBe(target);
  });

  it("round-trips a target through buildRelayUrl and extractTargetUrl", () => {
    const target =
      "https://bans.scrap.tf/index.php?p=banlist&advType=steamid#results";

    expect(extractTargetUrl(buildRelayUrl(target))).toBe(target);
  });

  it("returns an empty string for a missing URL", () => {
    expect(extractTargetUrl(null)).toBe("");
  });

  it("leaves a URL that is not wrapped in the relay untouched", () => {
    expect(extractTargetUrl("https://www.skial.com/bans")).toBe(
      "https://www.skial.com/bans"
    );
  });
});

describe("getSteamId", () => {
  it("returns steam3 format when steamIdType is steam3", () => {
    const player = new SteamId("STEAM_0:1:64716503");
    expect(getSteamId(player, "steam3")).toBe(player.getSteam3RenderedID());
  });

  it("returns steam2 new format when steamIdType is steam2_new", () => {
    const player = new SteamId("STEAM_0:1:64716503");
    expect(getSteamId(player, "steam2_new")).toBe(
      player.getSteam2RenderedID(true)
    );
  });

  it("returns steam2 old format when steamIdType is steam2_old", () => {
    const player = new SteamId("STEAM_0:1:64716503");
    expect(getSteamId(player, "steam2_old")).toBe(
      player.getSteam2RenderedID(false)
    );
  });

  it("defaults to steam2_old when steamIdType is undefined", () => {
    const player = new SteamId("STEAM_0:1:64716503");
    expect(getSteamId(player, undefined)).toBe(player.getSteam2RenderedID());
  });
});

describe("isCacheExpired", () => {
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

  it("returns true when timestamp is older than 7 days", () => {
    const oldTimestamp = Date.now() - oneWeekMs - 1000;
    expect(isCacheExpired(oldTimestamp)).toBe(true);
  });

  it("returns false when timestamp is within 7 days", () => {
    const recentTimestamp = Date.now() - oneWeekMs + 1000;
    expect(isCacheExpired(recentTimestamp)).toBe(false);
  });

  it("returns true when timestamp is exactly 7 days ago", () => {
    const exactlyOneWeekAgo = Date.now() - oneWeekMs;
    expect(isCacheExpired(exactlyOneWeekAgo)).toBe(true);
  });
});

describe("performFetch", () => {
  const ORDERED_NODE_SNAPSHOT_TYPE = 7;
  let mockSnapshotText: string;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("XPathResult", { ORDERED_NODE_SNAPSHOT_TYPE });
    vi.stubGlobal("DOMParser", function (this: unknown) {
      return {
        parseFromString: () => ({
          evaluate: () => ({
            snapshotItem: (i: number) =>
              i === 0 ? { textContent: mockSnapshotText } : null,
          }),
        }),
      };
    });
  });

  it('returns "Banned" when element text contains selectorText (default Permanent)', async () => {
    mockSnapshotText = "Permanent ban here";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("<html></html>"),
      })
    );

    const result = await performFetch({
      url: "https://example.com/bans",
      xpath: "//div[@id='target']",
      selectorIndex: 0,
    });

    expect(result).toBe("Banned");
  });

  it('returns "Not banned" when element text does not contain selectorText', async () => {
    mockSnapshotText = "Not banned";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("<html></html>"),
      })
    );

    const result = await performFetch({
      url: "https://example.com/bans",
      xpath: "//div[@id='target']",
      selectorIndex: 0,
    });

    expect(result).toBe("Not banned");
  });

  it('returns "error" (not "fail") when the transport rejects, so an outage is visible', async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error"))
    );

    const result = await performFetch({
      url: "/.netlify/functions/relay?url=https%3A%2F%2Fexample.com%2Fbans",
      xpath: "//div",
      selectorIndex: 0,
    });

    expect(result).toBe("error");
  });

  it('returns "error" when the relay marks its own failure', async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        headers: {
          get: (name: string) =>
            name === "x-relay-error" ? "upstream_fetch_failed" : null,
        },
        text: () => Promise.resolve('{"error":"upstream_fetch_failed"}'),
      })
    );

    const result = await performFetch({
      url: "/.netlify/functions/relay?url=https%3A%2F%2Fexample.com%2Fbans",
      xpath: "//div",
      selectorIndex: 0,
    });

    expect(result).toBe("error");
  });

  it("uses custom selectorText when provided", async () => {
    mockSnapshotText = "Custom banned text";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("<html></html>"),
      })
    );

    const result = await performFetch({
      url: "https://example.com/bans",
      xpath: "//div[@id='target']",
      selectorIndex: 0,
      selectorText: "Custom banned",
    });

    expect(result).toBe("Banned");
  });

  it('fails closed with "fail" on a non-2xx response', async () => {
    mockSnapshotText = "Permanent ban here";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('<div id="target">Permanent</div>'),
      })
    );

    const result = await performFetch({
      url: "https://example.com/bans",
      xpath: "//div[@id='target']",
      selectorIndex: 0,
    });

    expect(result).toBe("fail");
  });

  it('fails closed with "fail" when the response is not HTML', async () => {
    mockSnapshotText = "Permanent ban here";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) =>
            name === "content-type" ? "application/json" : null,
        },
        text: () => Promise.resolve('{"error":"rate limited"}'),
      })
    );

    const result = await performFetch({
      url: "https://example.com/bans",
      xpath: "//div[@id='target']",
      selectorIndex: 0,
    });

    expect(result).toBe("fail");
  });
});
