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
      <button @click="testSearch" class="test-button">Test</button>
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

<script>
export default {
  name: 'SearchResultComponent',
  props: {
    search: Object,
    index: Number,
  },
  methods: {
    removeProxyFromUrl(url) {
      const proxyUrl = 'https://stark-woodland-93683.fly.dev/';
      return url?.replace(proxyUrl, '') || '';
    },
    testSearch() {
      this.$store.dispatch('testSearch', this.search.domain);
    },
    getNewIssueUrl() {
      const repoUrl = 'https://github.com/DiegoFleitas/sourceban-checker';
      const title = `Scraping error - ${this.search.domain}`;
      const body = `Please fix :)`;
      return `${repoUrl}/issues/new?title=${title}&body=${body}&labels=bug&assignee=DiegoFleitas`;
    },
  },
  computed: {
    testResult() {
      const domain = this.search.domain
      const tests = this.$store.getters.getTestResult;
      return tests?.[domain];
    }
  },
};
</script>

<style scoped>
.search-result {
  margin-bottom: 20px;
}
</style>
