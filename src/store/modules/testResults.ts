import { performFetch } from "@/utils";
import type { Module } from "vuex";
import type { ServersData } from "@/types";
import serversDataJson from "@/servers.json";

const serversData = serversDataJson as ServersData;

export interface TestResultsState {
  testResults: Record<string, string>;
  testRequestsInFlight: Record<string, boolean>;
}

const testResults: Module<TestResultsState, unknown> = {
  state: (): TestResultsState => ({
    testResults: {},
    testRequestsInFlight: {},
  }),
  mutations: {
    updateTestResult(
      state: TestResultsState,
      payload: { domain: string; result: string }
    ) {
      state.testResults[payload.domain] = payload.result;
    },
    setTestRequestInFlight(
      state: TestResultsState,
      payload: { domain: string; inFlight: boolean }
    ) {
      state.testRequestsInFlight[payload.domain] = payload.inFlight;
    },
  },
  actions: {
    async testSearch({ commit, state }, domain: string) {
      if (state.testRequestsInFlight[domain]) return;
      const server = serversData.servers.find((sv) => sv.domain === domain);
      if (!server) return;
      commit("setTestRequestInFlight", { domain, inFlight: true });
      const proxy = "https://stark-woodland-93683.fly.dev/";
      const testUrl = proxy + server.example;
      try {
        const banStatus = await performFetch({
          url: testUrl,
          xpath: server.selector,
          selectorIndex: server.selectorIndex,
          selectorText: server?.selectorText,
        });
        const result = banStatus === "Banned" ? "pass" : "fail";
        commit("updateTestResult", { domain, result });
      } catch {
        commit("updateTestResult", { domain, result: "fail" });
      } finally {
        commit("setTestRequestInFlight", { domain, inFlight: false });
      }
    },
  },
  getters: {
    getTestResult: (state: TestResultsState) => {
      return state.testResults;
    },
    isTestRequestInFlight: (state: TestResultsState) => (domain: string) =>
      !!state.testRequestsInFlight[domain],
  },
};

export default testResults;
