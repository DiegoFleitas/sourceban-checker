import { createStore } from "vuex";
import DomParser from "dom-parser";
import serversData from "./servers.json";
import localForage from "localforage";

function performFetch({ url, xpath, selectorIndex, selectorText }) {
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
}

export default createStore({
  state: {
    searches: [],
    testResults: {},
    steamID: "",
  },
  mutations: {
    setSteamID(state, steamID) {
      state.steamID = steamID;
    },
    addSearch(state, search) {
      state.searches.push(search);
    },
    updateSearch(state, { index, data }) {
      state.searches[index] = {
        ...state.searches[index],
        ...data,
      };
    },
    clearSearches(state) {
      state.searches = [];
    },
    updateTestResult(state, { domain, result }) {
      state.testResults[domain] = result;
    },
  },
  actions: {
    async performSearch({ commit, state }, steamID) {
      const servers = serversData.servers;
      const proxy = "https://stark-woodland-93683.fly.dev/";
      // FIXME: skip skial for now (different format)
      servers
        .filter((server) => server.domain !== "skial.com")
        .forEach(async (server, index) => {
          const url = proxy + server.url + steamID;
          const search = {
            url,
            status: "loading",
            result: null,
          };
          commit("addSearch", search);

          const cacheKey = `${steamID}_${server.domain}`;
          localForage.getItem(cacheKey).then((cachedData) => {
            // If there is cached data and it is less than a week old, use it.
            const now = Date.now();
            const oneWeek = 7 * 24 * 60 * 60 * 1000; // in milliseconds
            if (cachedData && now - cachedData.timestamp < oneWeek) {
              commit("updateSearch", {
                index,
                data: {
                  domain: server.domain,
                  status: "complete",
                  result: cachedData.result,
                },
              });
              return;
            }

            performFetch({
              url,
              xpath: server.selector,
              selectorIndex: server.selectorIndex,
              selectorText: server?.selectorText,
            })
              .then(async (result) => {
                await localForage.setItem(cacheKey, { result, timestamp: now });
                commit("updateSearch", {
                  index,
                  data: { domain: server.domain, status: "complete", result },
                });
              })
              .catch((error) => {
                commit("updateSearch", {
                  index,
                  data: {
                    domain: server.domain,
                    status: "error",
                    result: error.toString(),
                  },
                });
              });
          });
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
  },
});
