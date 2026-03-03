const globals = require("globals");
const pluginVue = require("eslint-plugin-vue");
const tseslint = require("@typescript-eslint/eslint-plugin/use-at-your-own-risk/raw-plugin");
const eslintConfigPrettier = require("eslint-config-prettier");

module.exports = [
  { languageOptions: { globals: { ...globals.browser } } },
  require("@eslint/js").configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  ...tseslint.flatConfigs["flat/recommended"],
  {
    files: ["**/*.ts", "**/*.vue"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        extraFileExtensions: [".vue"],
      },
    },
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: require("vue-eslint-parser"),
      parserOptions: {
        parser: tseslint.parser,
        sourceType: "module",
        extraFileExtensions: [".vue"],
      },
    },
  },
  {
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  eslintConfigPrettier,
];
