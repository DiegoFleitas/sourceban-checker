<template>
  <div class="search-component">
    <h2 class="search-title">
      {{ msg }}
    </h2>
    <div class="search-layout">
      <p class="search-label">Enter a SteamID to check:</p>
      <div class="search-row">
        <input
          v-model="steamId"
          type="text"
          class="search-input"
          placeholder="Enter SteamID ex: STEAM_0:1:64716503"
          @keyup.enter="search"
        />
        <button
          class="primary-button"
          :disabled="isSearchInFlight"
          @click="search"
        >
          Search
        </button>
      </div>
      <p class="search-helper">
        Supports classic SteamID formats; whitespace is ignored.
      </p>
      <a
        :href="getMissingDomainIssueUrl()"
        target="_blank"
        rel="noopener noreferrer"
        class="secondary-link"
      >
        Missing a domain? Suggest it.
      </a>
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
  created() {
    const self = this as unknown as {
      $route: { query: { steamid?: string | string[] } };
      steamId: string;
    };
    const steamid = self.$route.query.steamid;
    if (steamid) {
      self.steamId = Array.isArray(steamid) ? steamid[0] : steamid;
    }
  },
  computed: {
    isSearchInFlight(): boolean {
      const self = this as unknown as {
        $store: { getters: { isSearchInFlight: boolean } };
      };
      return self.$store.getters.isSearchInFlight;
    },
  },
  methods: {
    getMissingDomainIssueUrl(): string {
      const repoUrl = "https://github.com/DiegoFleitas/sourceban-checker";
      const title = "Missing domain suggestion";
      const body =
        "Please share the domain that is missing and any helpful context.";
      return `${repoUrl}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    },
    search() {
      const self = this as unknown as {
        steamId: string;
        $store: { commit: (a: string) => void };
        $emit: (e: string, v: string) => void;
      };
      if (!self.steamId) {
        return;
      }
      self.$store.commit("clearSearches");
      self.$emit("search", self.steamId);
    },
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

.secondary-link {
  display: inline-block;
  margin-top: 0.5rem;
}
</style>
