<template>
  <div id="app">
    <!-- <img alt="Vue logo" src="https://vuejs.org/images/logo.png" /> -->
    <SearchComponent
      @search="performSearch"
      msg="Search SourceBans++ banlists"
    />
    <p>{{ progressCount }}</p>
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
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #393838;
  margin-top: 60px;
  background-color: white;
}

h1 {
  color: #2c3e50;
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
  background-color: #eaeaea;
}

th, td {
  width: 20%;
  text-align: center; 
  padding: 5px; 
  background-color: #393838;
  color: white;
}

td {
  background-color: white;
  color: #393838;
}

td span {
  color: #393838
}

.danger {
  color: #b80202;
}

.suceess {
  color: green;
}

a {
  color: #2f4075;
}
</style>