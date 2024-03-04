// symblink to .eslintrc.js in root of project
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:jest/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    // tsconfigRootDir: __dirname, // Disabled because the Amplify build
    // will fail when not all projects are npm installed.
    project: ["./tsconfig.json"],
    projectFolderIgnoreList: ["**/dist/**", "**/node_modules/**", "**/build/**", "**/.aws-sam/**"],
  },
  plugins: ["@typescript-eslint", "unused-imports", "jest-extended", "no-relative-import-paths", "rewrite-imports"],
  root: true,
  ignorePatterns: [
    "**/dist/**",
    "**/node_modules/",
    "**/node_modules/**",
    "**/build/**",
    "**/.aws-sam/**",
    ".eslintrc.js",
    ".eslintrc.cjs",
    "**/__generated__/",
    "**/__generated__/**",
    "**/*.js",
  ],
  rules: {
    "@typescript-eslint/no-misused-promises": "error",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-unused-expressions": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        args: "none",
      },
    ],
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-types": ["error", { types: { "{}": false } }],
    "unused-imports/no-unused-imports-ts": "error",
    "require-yield": "off",
    "prefer-const": "error",
    "@typescript-eslint/restrict-template-expressions": [
      "error",
      {
        allowNullish: true,
      },
    ],
    "@typescript-eslint/no-empty-function": "warn",
    "@typescript-eslint/no-unnecessary-condition": "error",
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          { group: ["node:test"], message: "Please use @jest/global instead." },
          { importNames: ["graphql"], group: ["graphql"], message: "Please use @/typed-graphql." },
          {
            importNames: ["RequestContext"],
            group: ["node-fetch"],
            message: "Did you mean to import it from @/RequestContext?",
          },
          {
            importNames: ["program"],
            group: ["commander"],
            message: 'Do not import "program". Use "createCommand" from src/utils/commands instead.',
          },
          {
            importNames: ["createCommand"],
            group: ["commander"],
            message: 'Do not import "createCommand". Use "createCommand" from src/utils/commands instead.',
          },
          {
            group: ["@/lambdaHandler", "**/lambdaHandler", "@/sqsHandler", "**/sqsHandler"],
            message: "Do not import the entrypoint module.",
          },
        ],
      },
    ],
    "no-restricted-syntax": [
      "error",
      {
        selector: "CallExpression[callee.name='expect']",
        message: "Function expressions are not allowed in source files.",
      },
    ],
    curly: "error",
    "object-shorthand": ["error", "always"],
    "no-useless-rename": "error",
    "no-relative-import-paths/no-relative-import-paths": "error",
    "rewrite-imports/rewrite-imports": ["error"],
  },
  overrides: [
    {
      files: ["**/tests/**/*.ts", "**/tests/**/*.tsx"],
      rules: {
        "no-restricted-syntax": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "testing-library/await-async-query": "off",
        "testing-library/await-sync-query": "off",
      },
    },
    {
      files: ["jest.config.ts"],
      rules: {
        "no-relative-import-paths/no-relative-import-paths": "off",
      },
    },
  ],
};
