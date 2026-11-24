<template>
  <tr class="search-result">
    <td>
      <a
        :href="toTargetUrl(search.url)"
        target="_blank"
        rel="noopener noreferrer"
        >{{ search.domain }}</a
      >
    </td>
    <td>
      <span>{{ search.status }}</span>
    </td>
    <td>
      <a
        v-if="search.result === 'Banned'"
        :href="toTargetUrl(search.url)"
        target="_blank"
        rel="noopener noreferrer"
        class="danger"
      >
        {{ search.result }}
      </a>
      <a
        v-else-if="search.result === 'fail'"
        :href="getNewIssueUrl()"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ search.result }}
      </a>
      <span v-else>{{ search.result }}</span>
    </td>
    <td>
      <button
        class="table-action-button"
        :disabled="isTestInFlight"
        @click="testSearch"
      >
        Test
      </button>
    </td>
    <td>
      <div v-if="testResult === 'pass'">
        <span class="suceess">✔</span> Test passed
      </div>
      <div v-else-if="testResult === 'fail'">
        <span class="danger">❌</span>
        <a :href="getNewIssueUrl()" target="_blank" rel="noopener noreferrer"
          >Test failed</a
        >
      </div>
      <div v-else-if="testResult === 'error'">
        <span class="danger">❌</span>
        <a :href="getNewIssueUrl()" target="_blank" rel="noopener noreferrer"
          >Test error</a
        >
      </div>
    </td>
  </tr>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import type { SearchItem } from "@/types";
import { extractTargetUrl } from "@/utils";

export default defineComponent({
  name: "SearchResultComponent",
  props: {
    search: {
      type: Object as () => SearchItem,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
  },
  computed: {
    testResult(): string | undefined {
      const self = this as unknown as {
        search: SearchItem;
        $store: { getters: { getTestResult: Record<string, string> } };
      };
      const domain = self.search.domain;
      const tests = self.$store.getters.getTestResult;
      return tests?.[domain];
    },
    isTestInFlight(): boolean {
      const self = this as unknown as {
        search: SearchItem;
        $store: { getters: { isTestRequestInFlight: (d: string) => boolean } };
      };
      return self.$store.getters.isTestRequestInFlight(self.search.domain);
    },
  },
  methods: {
    toTargetUrl(relayedUrl: string | null): string {
      return extractTargetUrl(relayedUrl);
    },
    testSearch() {
      const self = this as unknown as {
        search: SearchItem;
        $store: { dispatch: (a: string, b: string) => void };
      };
      self.$store.dispatch("testSearch", self.search.domain);
    },
    getNewIssueUrl(): string {
      const self = this as unknown as { search: SearchItem };
      const repoUrl = "https://github.com/DiegoFleitas/sourceban-checker";
      const title = `Scraping error - ${self.search.domain}`;
      const body = `Please fix :)`;
      return `${repoUrl}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&labels=bug&assignee=DiegoFleitas`;
    },
  },
});
</script>

<style scoped>
.search-result {
  margin-bottom: 20px;
}
</style>
