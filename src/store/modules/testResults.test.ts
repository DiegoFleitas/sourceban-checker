import { describe, it, expect, vi, beforeEach } from "vitest";
import { createStore } from "vuex";

vi.mock("@/utils", () => ({
  performFetch: vi.fn(),
}));

import testResults from "./testResults";
import { performFetch } from "@/utils";

function createTestResultsStore() {
  return createStore({
    modules: { testResults },
  });
}

describe("testResults store module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(performFetch).mockResolvedValue("Banned");
  });

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

  it("getter isTestRequestInFlight defaults to false", () => {
    const store = createTestResultsStore();
    expect(store.getters.isTestRequestInFlight("example.com")).toBe(false);
  });

  it("action testSearch no-ops for duplicate in-flight domain requests", async () => {
    const store = createTestResultsStore();
    const state = store.state as {
      testResults: { testRequestsInFlight: Record<string, boolean> };
    };
    state.testResults.testRequestsInFlight["skial.com"] = true;

    await store.dispatch("testSearch", "skial.com");

    expect(performFetch).not.toHaveBeenCalled();
  });

  it("action testSearch toggles per-domain in-flight state", async () => {
    const store = createTestResultsStore();
    const domain = "skial.com";

    const dispatchPromise = store.dispatch("testSearch", domain);
    expect(store.getters.isTestRequestInFlight(domain)).toBe(true);

    await dispatchPromise;

    expect(store.getters.isTestRequestInFlight(domain)).toBe(false);
  });
});
