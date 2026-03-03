import { describe, it, expect } from "vitest";
import { createStore } from "vuex";
import testResults from "./testResults";

function createTestResultsStore() {
  return createStore({
    modules: { testResults },
  });
}

describe("testResults store module", () => {
  it("getter getTestResult returns empty object initially", () => {
    const store = createTestResultsStore();
    expect(store.getters.getTestResult).toEqual({});
  });

  it("commit updateTestResult updates getTestResult", () => {
    const store = createTestResultsStore();
    store.commit("updateTestResult", { domain: "example.com", result: "pass" });
    expect(store.getters.getTestResult).toEqual({ "example.com": "pass" });
  });

  it("commit updateTestResult for multiple domains", () => {
    const store = createTestResultsStore();
    store.commit("updateTestResult", { domain: "a.com", result: "pass" });
    store.commit("updateTestResult", { domain: "b.com", result: "fail" });
    expect(store.getters.getTestResult).toEqual({
      "a.com": "pass",
      "b.com": "fail",
    });
  });
});
