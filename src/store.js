import { createStore } from "vuex";
import DomParser from "dom-parser";
import serversData from "./servers.json";

function performFetch({ url, xpath, selectorIndex }) {
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
      console.log(url, element?.outerText);
      let banStatus = "Not banned";
      if (element?.outerText?.includes("Permanent")) {
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
    testResults: [],
  },
  mutations: {
    addSearch(state, search) {
      state.searches.push(search);
    },
    updateSearch(state, { index, data }) {
      state.searches[index] = {
        ...state.searches[index],
        ...data,
      };
    },
    updateTestResult(state, { index, result }) {
      state.testResults[index] = result;
    },
  },
  actions: {
    performSearch({ commit }, steamID) {
      const servers = serversData.servers;
      // FIXME: skial uses other format
      servers.shift();
      const proxy = "https://stark-woodland-93683.fly.dev/";
      servers.forEach((server, index) => {
        const url = proxy + server.url + steamID;
        const search = {
          url,
          status: "loading",
          result: null,
        };
        commit("addSearch", search);
        performFetch({
          url,
          xpath: server.selector,
          selectorIndex: server.selectorIndex,
        })
          .then((result) => {
            commit("updateSearch", {
              index,
              data: { status: "complete", result },
            });
          })
          .catch((error) => {
            commit("updateSearch", {
              index,
              data: { status: "error", result: error.toString() },
            });
          });
      });
    },
    testSearch({ commit }, index) {
      const server = serversData.servers[index];
      const proxy = "https://stark-woodland-93683.fly.dev/";
      const testUrl = proxy + server.example;
      performFetch({
        url: testUrl,
        xpath: server.selector,
        selectorIndex: server.selectorIndex,
      })
        .then((banStatus) => {
          const result = banStatus === "Banned" ? "pass" : "fail";
          commit("updateTestResult", { index, result });
        })
        .catch(() => {
          commit("updateTestResult", { index, result: "fail" });
        });
    },
  },
});
