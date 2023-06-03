import { performFetch } from "../../utils.js";
import serversData from "../../servers.json";

export default {
  state: {
    testResults: {},
  },
  mutations: {
    updateTestResult(state, { domain, result }) {
      state.testResults[domain] = result;
    },
  },
  actions: {
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
    getTestResult: (state) => {
      return state.testResults;
    },
  },
};
