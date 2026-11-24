import { describe, it, expect, vi, beforeEach } from "vitest";
import { createStore } from "vuex";

vi.mock("@/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/utils")>();
  return {
    ...actual,
    performFetch: vi.fn().mockResolvedValue("Not banned"),
    getSteamId: vi.fn().mockReturnValue("resolved-id"),
    isCacheExpired: vi.fn().mockReturnValue(true),
  };
});

vi.mock("localforage", () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("steamid", () => ({
  default: vi.fn(function SteamIdMock(steamId: string) {
    if (steamId === "invalid") {
      throw new Error("Unknown SteamID input format");
    }
    return {};
  }),
}));

import searches from "./searches";
import { performFetch } from "@/utils";
import localForage from "localforage";
import SteamId from "steamid";

function createSearchesStore() {
  return createStore({
    modules: { searches },
  });
}

describe("searches store module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(performFetch).mockResolvedValue("Not banned");
    vi.mocked(localForage.getItem).mockResolvedValue(null);
    vi.mocked(localForage.setItem).mockResolvedValue(undefined);
    (
      searches.state as { searchInFlight: boolean; serversChecked: number }
    ).searchInFlight = false;
    (
      searches.state as { searchInFlight: boolean; serversChecked: number }
    ).serversChecked = 0;
  });

  it("getter progressCount formats servers checked count", () => {
    const store = createSearchesStore();
    expect(store.getters.progressCount).toMatch(
      /^\[0 \/ \d+ servers being checked\]$/
    );
  });

  it("getter sortedSearches returns list with Banned first, then Not banned, then loading/error", () => {
    const store = createSearchesStore();
    const list = store.getters.sortedSearches;
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    const statuses = list.map((s: { result: string | null }) => s.result);
    const bannedIndex = statuses.indexOf("Banned");
    const notBannedIndex = statuses.indexOf("Not banned");
    const loadingIndex = statuses.indexOf("loading");
    if (bannedIndex >= 0 && notBannedIndex >= 0) {
      expect(bannedIndex).toBeLessThan(notBannedIndex);
    }
    if (notBannedIndex >= 0 && loadingIndex >= 0) {
      expect(notBannedIndex).toBeLessThan(loadingIndex);
    }
  });

  it("mutation clearSearches resets all search results to null", () => {
    const store = createSearchesStore();
    const initial = store.getters.sortedSearches;
    store.commit("clearSearches");
    const after = store.getters.sortedSearches;
    expect(after.length).toBe(initial.length);
    after.forEach((s: { status: string | null; result: string | null }) => {
      expect(s.status).toBe(null);
      expect(s.result).toBe(null);
    });
  });

  it("action performSearch no-ops while a search is in flight", async () => {
    const store = createSearchesStore();
    (
      store.state as { searches: { searchInFlight: boolean } }
    ).searches.searchInFlight = true;

    await store.dispatch("performSearch", "STEAM_0:1:64716503");

    expect(localForage.getItem).not.toHaveBeenCalled();
    expect(performFetch).not.toHaveBeenCalled();
  });

  it("action performSearch toggles in-flight state and clears it after completion", async () => {
    const store = createSearchesStore();

    expect(store.getters.isSearchInFlight).toBe(false);

    const dispatchPromise = store.dispatch(
      "performSearch",
      "STEAM_0:1:64716503"
    );
    expect(store.getters.isSearchInFlight).toBe(true);

    await dispatchPromise;

    expect(store.getters.isSearchInFlight).toBe(false);
    expect(
      (
        store.state as {
          searches: { serversChecked: number; totalServers: number };
        }
      ).searches.serversChecked
    ).toBe(
      (
        store.state as {
          searches: { serversChecked: number; totalServers: number };
        }
      ).searches.totalServers
    );
  });

  it("action performSearch rejects invalid input without a stuck in-flight flag", async () => {
    const store = createSearchesStore();

    await store.dispatch("performSearch", "invalid");

    expect(store.getters.isSearchInFlight).toBe(false);
    expect(performFetch).not.toHaveBeenCalled();
  });

  it("action performSearch requests each banlist through the same-origin relay", async () => {
    const store = createSearchesStore();

    await store.dispatch("performSearch", "STEAM_0:1:64716503");

    const firstCall = vi.mocked(performFetch).mock.calls[0][0];
    expect(firstCall.url.startsWith("/.netlify/functions/relay?url=")).toBe(
      true
    );
    const relayedTarget = new URLSearchParams(firstCall.url.split("?")[1]).get(
      "url"
    );
    expect(relayedTarget).toBe(
      "https://www.skial.com/sourcebans/index.php?p=banlist&advType=steamid&advSearch=resolved-id"
    );
  });

  it("action performSearch trims whitespace before parsing", async () => {
    const store = createSearchesStore();

    await store.dispatch("performSearch", " STEAM_0:1:64716503 ");

    expect(SteamId).toHaveBeenCalledWith("STEAM_0:1:64716503");
    expect(store.getters.isSearchInFlight).toBe(false);
  });
});
