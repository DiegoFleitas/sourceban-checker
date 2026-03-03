import { performFetch, getSteamId, isCacheExpired } from "@/utils";
import type { Module } from "vuex";
import type { SearchItem, ServersData } from "@/types";
import serversDataJson from "@/servers.json";
import localForage from "localforage";
import SteamId from "steamid";

const serversData = serversDataJson as ServersData;

export interface SearchesState {
  searches: SearchItem[];
  steamId: string;
  serversChecked: number;
  totalServers: number;
}

const searches: Module<SearchesState, unknown> = {
  state: {
    searches: serversData.servers.map((server) => ({
      domain: server.domain,
      url: server.url,
      status: null,
      result: null,
    })),
    steamId: "",
    serversChecked: 0,
    totalServers: serversData.servers.length,
  },
  mutations: {
    updateSearch(
      state: SearchesState,
      payload: { domain: string; data: Partial<SearchItem> }
    ) {
      const searchIndex = state.searches.findIndex(
        (search) => search.domain === payload.domain
      );
      if (searchIndex !== -1) {
        state.searches[searchIndex] = {
          ...state.searches[searchIndex],
          ...payload.data,
        };
      }
    },
    clearSearches(state: SearchesState) {
      state.searches = serversData.servers.map((server) => ({
        domain: server.domain,
        url: server.url,
        status: null,
        result: null,
      }));
    },
    incrementServersChecked(state: SearchesState) {
      state.serversChecked++;
    },
    clearServersChecked(state: SearchesState) {
      state.serversChecked = 0;
    },
  },
  actions: {
    async performSearch({ commit }, steamId: string) {
      commit("clearServersChecked");
      const servers = serversData.servers;
      const proxy = "https://stark-woodland-93683.fly.dev/";
      const player = new SteamId(steamId);
      servers.forEach(async (server) => {
        const domain = server.domain;
        const resolvedSteamId = getSteamId(player, server.steamIdType);
        const url = `${proxy}${server.url}${resolvedSteamId}`;

        const cacheKey = `${resolvedSteamId}_${domain}`;
        const cachedData = await localForage.getItem<{
          result: string;
          timestamp: number;
        }>(cacheKey);

        if (cachedData && !isCacheExpired(cachedData.timestamp)) {
          commit("updateSearch", {
            domain,
            data: {
              url,
              status: "complete",
              result: cachedData.result,
            },
          });
          commit("incrementServersChecked");
          return;
        }

        commit("updateSearch", {
          domain,
          data: { url, status: "loading", result: null },
        });

        try {
          const result = await performFetch({
            url,
            xpath: server.selector,
            selectorIndex: server.selectorIndex,
            selectorText: server?.selectorText,
          });
          await localForage.setItem(cacheKey, {
            result,
            timestamp: Date.now(),
          });
          commit("updateSearch", {
            domain,
            data: { status: "complete", result },
          });
        } catch (error) {
          commit("updateSearch", {
            domain,
            data: {
              status: "error",
              result: error instanceof Error ? error.toString() : String(error),
            },
          });
        } finally {
          commit("incrementServersChecked");
        }
      });
    },
    clearSearches({ commit }) {
      commit("clearSearches");
    },
  },
  getters: {
    sortedSearches: (state: SearchesState) => {
      const searchesList = [...state.searches];
      return searchesList.sort((a, b) => {
        const statuses = ["Banned", "Not banned", "loading", "error"];
        const aIdx = statuses.indexOf(a.result ?? "");
        const bIdx = statuses.indexOf(b.result ?? "");
        return aIdx - bIdx;
      });
    },
    progressCount: (state: SearchesState) =>
      `[${state.serversChecked} / ${state.totalServers} servers being checked]`,
  },
};

export default searches;
