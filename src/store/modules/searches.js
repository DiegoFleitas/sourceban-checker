import { performFetch, getSteamId, isCacheExpired } from "../../utils.js";
import serversData from "../../servers.json";
import localForage from "localforage";
import SteamId from "steamid";

export default {
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
    updateSearch(state, { domain, data }) {
      const searchIndex = state.searches.findIndex(
        (search) => search.domain === domain
      );
      if (searchIndex !== -1) {
        state.searches[searchIndex] = {
          ...state.searches[searchIndex],
          ...data,
        };
      }
    },
    clearSearches(state) {
      state.searches = serversData.servers.map((server) => ({
        domain: server.domain,
        url: server.url,
        status: null,
        result: null,
      }));
    },

    incrementServersChecked(state) {
      state.serversChecked++;
    },
    clearServersChecked(state) {
      state.serversChecked = 0;
    },
  },
  actions: {
    async performSearch({ commit, state }, steamId) {
      commit("clearServersChecked");
      const servers = serversData.servers;
      const proxy = "https://stark-woodland-93683.fly.dev/";
      let player = new SteamId(steamId);
      servers.forEach(async (server) => {
        const domain = server.domain;
        const steamId = getSteamId(player, server.steamIdType);
        const url = `${proxy}${server.url}${steamId}`;

        const cacheKey = `${steamId}_${domain}`;
        const cachedData = await localForage.getItem(cacheKey);

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
            data: { status: "error", result: error.toString() },
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
    sortedSearches: (state) => {
      const searches = [...state.searches];

      return searches.sort((a, b) => {
        const statuses = ["Banned", "Not banned", "loading", "error"];
        return statuses.indexOf(a.result) - statuses.indexOf(b.result);
      });
    },
    progressCount: (state) =>
      `[${state.serversChecked} / ${state.totalServers} servers being checked]`,
  },
};
