<template>
  <div id="app">
    <a
      class="github-icon-link"
      href="https://github.com/DiegoFleitas/sourceban-checker"
      target="_blank"
      rel="noreferrer"
      aria-label="View on GitHub"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
          0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52
          -.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95
          0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2
          .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15
          0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2
          0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
        />
      </svg>
    </a>
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
.github-icon-link {
  position: fixed;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 40;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background-color: rgba(15, 23, 42, 0.85);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-soft);
  text-decoration: none;
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(8px);
  transition:
    transform 0.15s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.github-icon-link:hover {
  transform: translateY(-1px);
  border-color: rgba(96, 165, 250, 0.45);
  color: #93c5fd;
  box-shadow: 0 12px 30px rgba(37, 99, 235, 0.28);
  text-decoration: none;
}

.github-icon-link svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

@media (max-width: 640px) {
  .github-icon-link {
    top: 0.5rem;
    right: 0.5rem;
    width: 28px;
    height: 28px;
  }

  .github-icon-link svg {
    width: 14px;
    height: 14px;
  }
}

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
