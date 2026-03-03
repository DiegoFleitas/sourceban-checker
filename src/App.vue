<template>
  <div id="app">
    <main class="app-shell">
      <header class="app-header">
        <div>
          <h1 class="app-title">SourceBans++ banlist checker</h1>
          <p class="app-subtitle">
            Quickly check whether a SteamID appears on any of the configured SourceBans++ banlists.
          </p>
        </div>
        <div v-if="progressCount" class="status-pill">
          <span class="status-pill__dot"></span>
          <span>{{ progressCount }}</span>
        </div>
      </header>

      <section class="card card--surface-soft">
        <SearchComponent
          @search="performSearch"
          msg="Search SourceBans++ banlists"
        />
      </section>

      <section class="card">
        <div class="results-wrapper" v-if="sortedSearches && sortedSearches.length">
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

<script>
import { mapState, useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { watch } from 'vue';

import SearchComponent from './components/SearchComponent.vue';
import SearchResultComponent from './components/SearchResultComponent.vue';

function cleanSteamId(steamId) {
  return steamId.replace(/\s/g, '');
}

export default {
  name: 'App',
  components: {
    SearchComponent,
    SearchResultComponent,
  },
  computed: {
    ...mapState(['searches']),
    sortedSearches() {
      return this.$store.getters.sortedSearches;
    },
    progressCount() {
      return this.$store.getters.progressCount;
    },
  },
  methods: {
    performSearch(steamId) {
      this.$store.commit('setSteamID', cleanSteamId(steamId))
      this.$store.dispatch('performSearch', steamId);
    },
    
  },
  setup() {
    const route = useRoute();
    const store = useStore();

    watch(() => route.query, (newQuery, oldQuery) => {
      const steamId = newQuery?.steamid;
      if (steamId) {
        store.commit('setSteamID', cleanSteamId(steamId))
        store.dispatch('performSearch', steamId);
      }
    });
  },
};
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