import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createStore } from "vuex";
import { createRouter, createMemoryHistory } from "vue-router";
import SearchComponent from "./SearchComponent.vue";

describe("SearchComponent", () => {
  async function mountComponent(
    routeQuery: Record<string, string> = {},
    isSearchInFlight = false
  ) {
    const mockStore = createStore({
      state: { steamId: "" },
      mutations: {
        setSteamID: vi.fn(),
        clearSearches: vi.fn(),
      },
      getters: {
        isSearchInFlight: () => isSearchInFlight,
      },
    });
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: "/", component: { template: "<div />" } }],
    });
    await router.push({ path: "/", query: routeQuery });

    return mount(SearchComponent, {
      global: {
        plugins: [mockStore, router],
        stubs: {},
      },
      props: { msg: "Search SourceBans++ banlists" },
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the message prop", async () => {
    const wrapper = await mountComponent();
    expect(wrapper.text()).toContain("Search SourceBans++ banlists");
  });

  it("emits search with steamId when Search is clicked", async () => {
    const wrapper = await mountComponent();
    await wrapper.find("input").setValue("STEAM_0:1:64716503");
    await wrapper.find("button.primary-button").trigger("click");
    expect(wrapper.emitted("search")).toEqual([["STEAM_0:1:64716503"]]);
  });

  it("does not emit when steamId is empty", async () => {
    const wrapper = await mountComponent();
    await wrapper.find("button.primary-button").trigger("click");
    expect(wrapper.emitted("search")).toBeFalsy();
  });

  it("disables Search button while search is in flight", async () => {
    const wrapper = await mountComponent({}, true);
    expect(
      wrapper.find("button.primary-button").attributes("disabled")
    ).toBeDefined();
  });
});
