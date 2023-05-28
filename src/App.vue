<template>
  <div id="app">
    <!-- <img alt="Vue logo" src="https://vuejs.org/images/logo.png" /> -->
    <SearchComponent
      @search="performSearch"
      msg="Search SourceBans++ banlists"
    />
    <SearchResultComponent
      v-for="(search, index) in searches"
      :key="index"
      :search="search"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex';

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
  },
  methods: {
    performSearch(steamID) {
      this.$store.dispatch('performSearch', steamID);
    },
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
</style>
