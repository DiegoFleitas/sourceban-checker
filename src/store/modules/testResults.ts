import { performFetch } from "@/utils";
import type { Module } from "vuex";
import type { ServersData } from "@/types";
import serversDataJson from "@/servers.json";

const serversData = serversDataJson as ServersData;

export interface TestResultsState {
  testResults: Record<string, string>;
}

const testResults: Module<TestResultsState, unknown> = {
  state: {
    testResults: {},
  },
  mutations: {
    updateTestResult(
      state: TestResultsState,
      payload: { domain: string; result: string }
    ) {
      state.testResults[payload.domain] = payload.result;
    },
  },
  actions: {
    testSearch(
      { commit },
      domain: string
    ) {
      const server = serversData.servers.find((sv) => sv.domain === domain);
      if (!server) return;
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
    getTestResult: (state: TestResultsState) => {
      return state.testResults;
    },
  },
};

export default testResults;
