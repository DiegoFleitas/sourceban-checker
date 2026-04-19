import { mergeConfig } from "vite";
import { defineConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: "happy-dom",
      coverage: {
        provider: "istanbul",
        reporter: ["text", "html", "lcov"],
        include: ["src/**/*.ts", "src/**/*.vue"],
        exclude: [
          "src/**/*.test.ts",
          "src/**/*.spec.ts",
          "src/env.d.ts",
          "src/main.ts",
        ],
      },
    },
  }),
);
