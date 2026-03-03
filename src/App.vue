<template>
  <div id="app">
    <main class="app-shell">
      <header class="app-header">
        <div>
          <h1 class="app-title">SourceBans++ banlist checker</h1>
          <p class="app-subtitle">
            Quickly check whether a SteamID appears on any of the configured
            SourceBans++ banlists.
          </p>
        </div>
        <div v-if="progressCount" class="status-pill">
          <span class="status-pill__dot" />
          <span>{{ progressCount }}</span>
        </div>
      </header>

      <section class="card card--surface-soft">
        <SearchComponent
          msg="Search SourceBans++ banlists"
          @search="performSearch"
        />
      </section>

      <section class="card">
        <div
          v-if="sortedSearches && sortedSearches.length"
          class="results-wrapper"
        >
          <table>
            <thead>
              <tr>
                <th>URL</th>
                <th>Status</th>
                <th>Result</th>
                <th>Test</th>
                <th>Test Result</th>
              </tr>
            </thead>
            <tbody>
              <SearchResultComponent
                v-for="(search, index) in sortedSearches"
                :key="index"
                :search="search"
                :index="index"
              />
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">
          <p class="empty-state__title">No results yet</p>
          <p class="empty-state__subtitle">
            Run a search with a SteamID to see bans from configured servers.
          </p>
        </div>
      </section>
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent, watch } from "vue";
import { mapState, useStore } from "vuex";
import { useRoute } from "vue-router";

import SearchComponent from "./components/SearchComponent.vue";
import SearchResultComponent from "./components/SearchResultComponent.vue";
import type { SearchItem } from "./types";

function cleanSteamId(steamId: string): string {
  return steamId.replace(/\s/g, "");
}

export default defineComponent({
  name: "App",
  components: {
    SearchComponent,
    SearchResultComponent,
  },
  setup() {
    const route = useRoute();
    const store = useStore();

    watch(
      () => route.query,
      (newQuery: Record<string, string | string[]>) => {
        const steamId = newQuery?.steamid;
        if (steamId) {
          store.commit("setSteamID", cleanSteamId(steamId as string));
          store.dispatch("performSearch", steamId as string);
        }
      }
    );
  },
  computed: {
    ...mapState(["searches"]),
    sortedSearches(): SearchItem[] {
      return (
        this as unknown as {
          $store: { getters: { sortedSearches: SearchItem[] } };
        }
      ).$store.getters.sortedSearches;
    },
    progressCount(): string {
      return (
        this as unknown as { $store: { getters: { progressCount: string } } }
      ).$store.getters.progressCount;
    },
  },
  methods: {
    performSearch(steamId: string) {
      const self = this as unknown as {
        $store: {
          commit: (a: string, b: string) => void;
          dispatch: (a: string, b: string) => void;
        };
      };
      self.$store.commit("setSteamID", cleanSteamId(steamId));
      self.$store.dispatch("performSearch", steamId);
    },
  },
});
</script>

<style>
.empty-state {
  padding: 1.5rem 1.25rem;
  text-align: left;
}

.empty-state__title {
  margin: 0 0 0.25rem;
  font-weight: 500;
}

.empty-state__subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-soft);
}
</style>
