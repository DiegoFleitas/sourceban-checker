import { createStore } from "vuex";
import searches from "./modules/searches.js";
import testResults from "./modules/testResults.js";

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
