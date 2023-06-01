<template>
  <!-- hide skial.com results -->
  <tr class="search-result" v-if="search.domain !== 'skial.com'">
    <td>
      <a :href="removeProxyFromUrl(search.url)" target="_blank">{{
        removeProxyFromUrl(search.url)
      }}</a>
    </td>
    <td>{{ search.status }}</td>
    <td>
      <a
        v-if="search.result === 'Banned'"
        :href="removeProxyFromUrl(search.url)"
        target="_blank"
        style="color: red;"
      >
        {{ search.result }}
      </a>
      <span v-else>{{ search.result }}</span>
    </td>
    <td>
      <button @click="testSearch" class="test-button">Test</button>
    </td>
    <td>
      <div v-if="testResult === 'pass'">
        <span style="color: green;">✔</span> Test passed
      </div>
      <div v-else-if="testResult === 'fail'">
        <span style="color: red;">❌</span> Test failed
      </div>
      <div v-else-if="testResult === 'error'">
        <span style="color: red;">❌</span> Test error
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
  },
  computed: {
    testResult() {
      return this.$store.state.testResults[this.search.domain];
    }
  },
};
</script>

<style scoped>
.search-result {
  margin-bottom: 20px;
}
</style>
