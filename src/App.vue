<template>
  <div id="app">
    <!-- <img alt="Vue logo" src="https://vuejs.org/images/logo.png" /> -->
    <SearchComponent
      @search="performSearch"
      msg="Search SourceBans++ banlists"
    />
    <div class="table-container">
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
  </div>
</template>

<script>
import { mapState, useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { watch } from 'vue';

import SearchComponent from './components/SearchComponent.vue';
import SearchResultComponent from './components/SearchResultComponent.vue';

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
  },
  methods: {
    performSearch(steamId) {
      this.$store.commit('setSteamID', steamId)
      this.$store.dispatch('performSearch', steamId);
    },
  },
  setup() {
    const route = useRoute();
    const store = useStore();

    watch(() => route.query, (newQuery, oldQuery) => {
      const steamId = newQuery?.steamid;
      if (steamId) {
        store.commit('setSteamID', steamId)
        store.dispatch('performSearch', steamId);
      }
    });
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.table-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

table {
  width: 100%;
  table-layout: fixed;
}

th, td {
  width: 20%;
  text-align: center; 
  padding: 5px; 
  border: 1px solid black;
}
</style>
