import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import store from "./store";
import "./styles.css";

const routes = [{ path: "/", component: App }];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Vue shim types createApp as unknown; cast to use .use() and .mount()
interface VueApp {
  use: (p: unknown) => VueApp;
  mount: (el: string) => void;
}
(createApp(App) as VueApp).use(store).use(router).mount("#app");
