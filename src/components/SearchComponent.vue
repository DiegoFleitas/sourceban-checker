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

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "SearchComponent",
  props: {
    msg: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      steamId: "" as string,
    };
  },
  methods: {
    search() {
      const self = this as unknown as { steamId: string; $store: { commit: (a: string) => void }; $emit: (e: string, v: string) => void };
      if (!self.steamId) {
        return;
      }
      self.$store.commit("clearSearches");
      self.$emit("search", self.steamId);
    },
  },
  created() {
    const self = this as unknown as { $route: { query: { steamid?: string | string[] } }; steamId: string };
    const steamid = self.$route.query.steamid;
    if (steamid) {
      self.steamId = Array.isArray(steamid) ? steamid[0] : steamid;
    }
  },
});
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
