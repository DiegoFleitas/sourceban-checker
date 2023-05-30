<template>
  <div class="search-component">
    <h1>{{ msg }}</h1>
    <p>Enter a SteamID to check:</p>
    <input
      v-model="steamID"
      @keyup.enter="search"
      type="text"
      placeholder="Enter SteamID ex:STEAM_0:1:64716503"
    />
    <div class="button-container">
      <button @click="search">Search</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SearchComponent',
  data() {
    return {
      steamID: '',
    };
  },
  props: {
    msg: String,
  },
  methods: {
    search() {
      if (!this.steamID) {
        alert('Please enter a SteamID');
        return;
      }
      this.$store.commit('clearSearches');
      this.$emit('search', this.steamID);
    },
  },
  created() {
    if (this.$route.query.steamid) {
      this.steamID = this.$route.query.steamid;
    }
  },
};
</script>

<style scoped>
.search-component {
  text-align: center;
  margin: 0 auto;
  width: 100%;
  max-width: 400px;
}

input {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
}

button {
  padding: 10px;
}
</style>
