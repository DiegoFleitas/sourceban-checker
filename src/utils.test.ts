import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSteamId, isCacheExpired, performFetch } from "./utils";
import SteamId from "steamid";

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

  it('returns "fail" when fetch rejects', async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error"))
    );

    const result = await performFetch({
      url: "https://example.com/bans",
      xpath: "//div",
      selectorIndex: 0,
    });

    expect(result).toBe("fail");
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
});
