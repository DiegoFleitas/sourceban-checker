import { createStore } from 'vuex';
import DomParser from 'dom-parser';
import serversData from './servers.json';
// import serversData from './test.json';

export default createStore({
  state: {
    searches: [],
  },
  mutations: {
    addSearch(state, search) {
      state.searches.push(search);
    },
    updateSearch(state, { index, data }) {
      state.searches[index] = {
        ...state.searches[index],
        ...data,
      };
    },
  },
  actions: {
    performSearch({ commit }, steamID) {
      const servers = serversData.servers;
      // FIXME: skial uses other format
      servers.shift();

      const proxy = 'https://stark-woodland-93683.fly.dev/';

      servers.forEach((server, index) => {
        const search = {
          url: proxy + server.url + steamID,
          status: 'loading',
          result: null,
        };
        commit('addSearch', search);

        fetch(search.url)
          .then((response) => {
            if (!response.ok) {
              console.log(response);
              // throw new Error(`${response.statusText}`);
            }
            return response.text();
          })
          .then((decodedText) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(decodedText, 'text/html');
            // select the detail
            const xpath = server.selector;
            const element = doc
              .evaluate(
                xpath,
                doc,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null
              )
              .snapshotItem(server.selectorIndex);
            console.log(element);
            console.log(server.url, element?.outerText);

            let banStatus = 'Not banned';
            if (element?.outerText?.includes('Permanent')) {
              banStatus = 'Banned';
            }

            commit('updateSearch', {
              index,
              data: { status: 'complete', result: banStatus },
            });
          })
          .catch((error) => {
            commit('updateSearch', {
              index,
              data: { status: 'error', result: error.toString() },
            });
          });
      });
    },
  },
});
