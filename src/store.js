import { createStore } from "vuex";
import DomParser from "dom-parser";
import SteamId from "steamid";
import serversData from "./servers.json";
import localForage from "localforage";

const performFetch = ({ url, xpath, selectorIndex, selectorText }) => {
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

// handles "STEAM_0" vs "STEAM_1" steam2 universe prefix
// ex: tf2 banlist use "STEAM_0", whereas csgo, l4d2, etc use "STEAM_1"
// see @https://developer.valvesoftware.com/wiki/SteamID#Universes_Available_for_Steam_Accounts
const getSteamId = (player, steamIdType) => {
  if (steamIdType === "steam3") {
    return player.getSteam3RenderedID();
  } else if (steamIdType === "steam2_new") {
    return player.getSteam2RenderedID(true);
  } else {
    // Default to steam2_old
    return player.getSteam2RenderedID();
  }
};

export default createStore({
  state: {
    searches: serversData.servers.map((server) => ({
      domain: server.domain,
      url: server.url,
      status: null,
      result: null,
    })),
    testResults: {},
    steamId: "",
    serversChecked: 0,
    totalServers: serversData.servers.length,
  },
  mutations: {
    setSteamID(state, steamId) {
      state.steamId = steamId;
    },
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
    updateTestResult(state, { domain, result }) {
      state.testResults[domain] = result;
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
        commit("incrementServersChecked");

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
        }
      });
    },
    testSearch({ commit }, domain) {
      const server = serversData.servers.find((sv) => sv.domain === domain);
      const proxy = "https://stark-woodland-93683.fly.dev/";
      const testUrl = proxy + server.example;
      performFetch({
        url: testUrl,
        xpath: server.selector,
        selectorIndex: server.selectorIndex,
        selectorText: server?.selectorText,
      })
        .then((banStatus) => {
          const result = banStatus === "Banned" ? "pass" : "fail";
          commit("updateTestResult", { domain, result });
        })
        .catch(() => {
          commit("updateTestResult", { domain, result: "fail" });
        });
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
});

const isCacheExpired = (timestamp) => {
  const oneWeek = 7 * 24 * 60 * 60 * 1000; // in milliseconds
  const now = Date.now();
  return now - timestamp >= oneWeek;
};
