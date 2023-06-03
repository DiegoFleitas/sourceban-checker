import { createStore } from "vuex";
import searches from "./searches.js";
import testResults from "./testResults.js";

export default createStore({
  modules: {
    searches,
    testResults,
  },
  state: {
    steamId: "",
  },
  mutations: {
    setSteamID(state, steamId) {
      state.steamId = steamId;
    },
  },
});
