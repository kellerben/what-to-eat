import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...compat.extends("eslint:recommended"),
  {
    files: ["nodejs/**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: {
        ...globals.node,
        Promise: false,
      },
      ecmaVersion: 8,
      sourceType: "commonjs",
      parserOptions: {
        ecmaFeatures: {
          jsx: false,
          experimentalObjectRestSpread: false,
        },
      },
    },
    rules: {
      indent: ["error", "tab", {
        SwitchCase: 1,
      }],
      "global-require": ["error"],
      "handle-callback-err": ["error"],
      "no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
      "no-console": "off",
      "no-unused-vars": ["error", {
        args: "none",
      }],
    },
  },

  {
    files: ["nginx/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        Vue: "readonly",
        SwaggerClient: "readonly",
        VueMarkdown: "readonly",
      },
      ecmaVersion: 6,
      sourceType: "script",
      parserOptions: {
        ecmaFeatures: {
          jsx: false,
          experimentalObjectRestSpread: false,
        },
      },
    },
    rules: {
      indent: ["error", "tab", {
        SwitchCase: 1,
      }],
      "no-unused-vars": ["error", {
        args: "none",
      }],
    },
  },
  ...pluginVue.configs["flat/essential"],
];

