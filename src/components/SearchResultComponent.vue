<template>
  <div class="search-result">
    <h2>
      <a :href="removeProxyFromUrl(search.url)" target="_blank">{{
        removeProxyFromUrl(search.url)
      }}</a>
    </h2>
    <p>Status: {{ search.status }}</p>
    <p>Result: {{ search.result }}</p>
  </div>
</template>

<script>
export default {
  name: 'SearchResultComponent',
  props: {
    search: Object,
  },
  methods: {
    removeProxyFromUrl(url) {
      const proxyUrl = 'https://stark-woodland-93683.fly.dev/';
      return url.replace(proxyUrl, '');
    },
  },
};
</script>

<style scoped>
.search-result {
  margin-bottom: 20px;
}
</style>
