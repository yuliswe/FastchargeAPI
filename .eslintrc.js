// symblink to .eslintrc.js in root of project
module.exports = {
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        // tsconfigRootDir: __dirname, // Disabled because the Amplify build
        // will fail when not all projects are npm installed.
        project: ["./tsconfig.json"],
        projectFolderIgnoreList: ["**/dist/**", "**/node_modules/**", "**/build/**", "**/.aws-sam/**"],
    },
    plugins: ["@typescript-eslint", "unused-imports"],
    root: true,
    ignorePatterns: [
        "**/dist/**",
        "**/node_modules/**",
        "**/build/**",
        "**/.aws-sam/**",
        ".eslintrc.js",
        ".eslintrc.cjs",
    ],
    rules: {
        "@typescript-eslint/no-misused-promises": "error",
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-unused-expressions": "error",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/ban-types": "off",
        "@typescript-eslint/restrict-plus-operands": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "unused-imports/no-unused-imports-ts": "warn",
        "require-yield": "off",
        "prefer-const": "off",
    },
};
