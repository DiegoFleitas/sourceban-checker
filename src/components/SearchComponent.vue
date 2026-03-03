<template>
  <div class="search-component">
    <h2 class="search-title">{{ msg }}</h2>
    <div class="search-layout">
      <p class="search-label">Enter a SteamID to check:</p>
      <div class="search-row">
        <input
          v-model="steamId"
          @keyup.enter="search"
          type="text"
          class="search-input"
          placeholder="Enter SteamID ex: STEAM_0:1:64716503"
        />
        <button class="primary-button" @click="search">
          Search
        </button>
      </div>
      <p class="search-helper">
        Supports classic SteamID formats; whitespace is ignored.
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: "SearchComponent",
  data() {
    return {
      steamId: "",
    };
  },
  props: {
    msg: String,
  },
  methods: {
    search() {
      if (!this.steamId) {
        return;
      }
      this.$store.commit("clearSearches");
      this.$emit("search", this.steamId);
    },
  },
  created() {
    if (this.$route.query.steamid) {
      this.steamId = this.$route.query.steamid;
    }
  },
};
</script>

<style scoped>
.search-component {
  margin: 0 auto;
  width: 100%;
  max-width: 520px;
}

.search-title {
  margin: 0 0 0.5rem;
  font-size: 1.05rem;
}

@media (max-width: 768px) {
  .search-component {
    max-width: 100%;
  }
}
</style>
