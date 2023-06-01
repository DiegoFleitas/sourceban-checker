import { createStore } from "vuex";
import DomParser from "dom-parser";
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

export default createStore({
  state: {
    searches: serversData.servers.map((server) => ({
      domain: server.domain,
      url: server.url,
      status: null,
      result: null,
    })),
    testResults: {},
    steamID: "",
    serversChecked: 0,
    // FIXME: skip skial for now (different format)
    totalServers: serversData.servers.length - 1,
  },
  mutations: {
    setSteamID(state, steamID) {
      state.steamID = steamID;
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
  },
  actions: {
    async performSearch({ commit, state }, steamID) {
      const servers = serversData.servers;
      const proxy = "https://stark-woodland-93683.fly.dev/";
      // FIXME: skip skial for now (different format)
      servers
        .filter((server) => server.domain !== "skial.com")
        .forEach(async (server) => {
          const domain = server.domain;
          const url = proxy + server.url + steamID;

          const cacheKey = `${steamID}_${domain}`;
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
      `[${state.serversChecked} / ${state.totalServers} servers checked]`,
  },
});

const isCacheExpired = (timestamp) => {
  const oneWeek = 7 * 24 * 60 * 60 * 1000; // in milliseconds
  const now = Date.now();
  return now - timestamp >= oneWeek;
};
