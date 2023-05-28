import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import store from "./store";

// Define your routes. The routes you define here will depend on your application.
const routes = [{ path: "/", component: App }];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

createApp(App).use(store).use(router).mount("#app");
