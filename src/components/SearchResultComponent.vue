<template>
  <tr class="search-result">
    <td>
      <a :href="removeProxyFromUrl(search.url)" target="_blank">{{
        removeProxyFromUrl(search.url)
      }}</a>
    </td>
    <td>{{ search.status }}</td>
    <td>{{ search.result }}</td>
    <td>
      <button @click="testSearch" class="test-button">Test</button>
    </td>
    <td>
      <div v-if="testResult === 'pass'">
        <span style="color: green;">✔</span> Test passed
      </div>
      <div v-else-if="testResult === 'fail'">
        <span style="color: green;">❌</span> Test failed
      </div>
      <div v-else-if="testResult === 'error'">
        <span style="color: green;">❌</span> Test error
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
      return url.replace(proxyUrl, '');
    },
    testSearch() {
      this.$store.dispatch('testSearch', this.index);
    },
  },
  computed: {
    testResult() {
      return this.$store.state.testResults[this.index];
    }
  },
};
</script>

<style scoped>
.search-result {
  margin-bottom: 20px;
}
</style>
