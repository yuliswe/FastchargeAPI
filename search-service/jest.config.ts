import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
    // [...]
    preset: "ts-jest/presets/js-with-ts", // or other ESM presets
    testEnvironment: "node",
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    transform: {
        // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
        // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                useESM: true,
            },
        ],
    },
    transformIgnorePatterns: ["/node_modules/(?!(chalk|graphql-service|@apollo|ts-invariant)/)"],
    modulePathIgnorePatterns: ["dist"],
};

export default jestConfig;
