import { createStore } from "vuex";
import searches from "./modules/searches";
import testResults from "./modules/testResults";

export interface RootState {
  steamId: string;
}

export default createStore({
  modules: {
    searches,
    testResults,
  },
  state: {
    steamId: "",
  } as RootState,
  mutations: {
    setSteamID(state: RootState, steamId: string) {
      state.steamId = steamId;
    },
  },
});
