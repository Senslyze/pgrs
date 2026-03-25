import js from "@eslint/js";
import boundaries from "eslint-plugin-boundaries";
import importPlugin from "eslint-plugin-import";
import tseslint from "typescript-eslint";

const boundaryElements = [
  {
    type: "app",
    pattern: "src/app/**",
  },
  {
    type: "feature",
    pattern: "src/features/*/**",
    capture: ["featureName"],
  },
  {
    type: "shared",
    pattern: "src/shared/**",
  },
  {
    type: "test",
    pattern: "tests/**",
  },
  {
    type: "script",
    pattern: "scripts/**",
  },
];

export default tseslint.config(
  {
    ignores: ["node_modules/**", "dist/**", "coverage/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    plugins: {
      boundaries,
      import: importPlugin,
    },
    settings: {
      boundaries: {
        elements: boundaryElements,
      },
      "boundaries/elements": boundaryElements,
    },
    rules: {
      "import/no-cycle": "error",
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          rules: [
            {
              from: { type: "app" },
              allow: {
                to: [{ type: "app" }, { type: "feature" }, { type: "shared" }],
              },
            },
            {
              from: { type: "feature" },
              allow: {
                to: [{ type: "feature" }, { type: "shared" }],
              },
            },
            {
              from: { type: "shared" },
              allow: {
                to: { type: "shared" },
              },
            },
            {
              from: { type: "test" },
              allow: {
                to: [{ type: "app" }, { type: "feature" }, { type: "shared" }, { type: "test" }],
              },
            },
            {
              from: { type: "script" },
              allow: {
                to: [{ type: "script" }, { type: "shared" }],
              },
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../../../app/**", "../../app/**", "../app/**"],
              message: "Features must not import the app layer.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/chat/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../../flow/**", "../flow/**", "../../../features/flow/**"],
              message: "Chat feature must stay isolated from the flow feature.",
            },
            {
              group: ["../../../app/**", "../../app/**", "../app/**"],
              message: "Features must not import the app layer.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/flow/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../../chat/**", "../chat/**", "../../../features/chat/**"],
              message: "Flow feature must stay isolated from the chat feature.",
            },
            {
              group: ["../../../app/**", "../../app/**", "../app/**"],
              message: "Features must not import the app layer.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/*/lib/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../server/**", "../../server/**"],
              message: "Feature lib files must not import feature server files.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/shared/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../../features/**", "../features/**", "../../app/**", "../app/**"],
              message: "Shared code must remain independent from app and feature layers.",
            },
          ],
        },
      ],
    },
  }
);
