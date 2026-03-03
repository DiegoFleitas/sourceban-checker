import { describe, it, expect } from "vitest";
import { createStore } from "vuex";
import searches from "./searches";

function createSearchesStore() {
  return createStore({
    modules: { searches },
  });
}

describe("searches store module", () => {
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
});
