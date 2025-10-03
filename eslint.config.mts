import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Global ignores - must be first and without 'files' property
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      ".vercel/**",
      "out/**",
      "dist/**",
      "build/**",
      "coverage/**",
      ".turbo/**",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.jest },
    },
  },
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "commonjs" },
    rules: {
      "@typescript-eslint/no-require-imports": "off", // Allow require() in JS files
    },
  },
  ...tseslint.configs.recommended,
  {
    ...pluginReact.configs.flat.recommended,
    settings: {
      react: {
        version: "detect", // Automatically detect React version
      },
    },
    rules: {
      // Relax some rules for hackathon development
      "@typescript-eslint/no-explicit-any": "warn", // Warn instead of error
      "@typescript-eslint/no-unused-vars": "warn", // Warn instead of error
      "@typescript-eslint/no-require-imports": "warn", // Warn for TS files
      "@typescript-eslint/triple-slash-reference": "off", // Allow Next.js generated files
      "@typescript-eslint/ban-ts-comment": "warn", // Warn instead of error
      "no-useless-escape": "warn", // Warn instead of error
      "react/react-in-jsx-scope": "off", // Not needed in Next.js 13+
      "react/prop-types": "off", // Using TypeScript for prop validation
    },
  },
]);
