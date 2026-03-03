/// <reference types="vite/client" />

declare module "*.vue" {
  const component: unknown;
  export default component;
}

declare module "steamid" {
  class SteamId {
    constructor(id: string);
    getSteam3RenderedID(): string;
    getSteam2RenderedID(newFormat?: boolean): string;
  }
  export = SteamId;
}

declare module "vue" {
  export function defineComponent(options: unknown): unknown;
  export function watch(source: unknown, cb: unknown, options?: unknown): unknown;
  export function createApp(rootComponent: unknown, rootProps?: unknown): unknown;
  export const ref: unknown;
  export const computed: unknown;
  export const onMounted: unknown;
  export const onUnmounted: unknown;
  export const reactive: unknown;
  export const toRef: unknown;
  export const toRefs: unknown;
  export const provide: unknown;
  export const inject: unknown;
  export const h: unknown;
  export const nextTick: unknown;
}

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $store: import("vuex").Store<unknown>;
    $route: import("vue-router").RouteLocationNormalizedLoaded;
  }
}
