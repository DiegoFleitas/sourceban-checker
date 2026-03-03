<template>
  <tr class="search-result">
    <td>
      <a :href="removeProxyFromUrl(search.url)" target="_blank">{{
        search.domain
      }}</a>
    </td>
    <td><span>{{ search.status }}</span></td>
    <td>
      <a
        v-if="search.result === 'Banned'"
        :href="removeProxyFromUrl(search.url)"
        target="_blank"
        class="danger"
      >
        {{ search.result }}
      </a>
      <a v-else-if="search.result === 'fail'" :href="getNewIssueUrl()" target="_blank">
        {{ search.result }}
      </a>
      <span v-else>{{ search.result }}</span>
    </td>
    <td>
      <button @click="testSearch" class="table-action-button">Test</button>
    </td>
    <td>
      <div v-if="testResult === 'pass'">
        <span class="suceess">✔</span> Test passed
      </div>
      <div v-else-if="testResult === 'fail'">
        <span class="danger">❌</span>
        <a :href="getNewIssueUrl()"  target="_blank">Test failed</a>
      </div>
      <div v-else-if="testResult === 'error'">
        <span class="danger">❌</span>
        <a :href="getNewIssueUrl()"  target="_blank">Test error</a>
      </div>
    </td>
  </tr>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import type { SearchItem } from "@/types";

const PROXY_URL = "https://stark-woodland-93683.fly.dev/";

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
  methods: {
    removeProxyFromUrl(url: string | null): string {
      return url?.replace(PROXY_URL, "") || "";
    },
    testSearch() {
      const self = this as unknown as { search: SearchItem; $store: { dispatch: (a: string, b: string) => void } };
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
  computed: {
    testResult(): string | undefined {
      const self = this as unknown as { search: SearchItem; $store: { getters: { getTestResult: Record<string, string> } } };
      const domain = self.search.domain;
      const tests = self.$store.getters.getTestResult;
      return tests?.[domain];
    },
  },
});
</script>

<style scoped>
.search-result {
  margin-bottom: 20px;
}
</style>
