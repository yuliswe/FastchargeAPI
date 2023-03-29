import { JestConfigWithTsJest, pathsToModuleNameMapper } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
    preset: "ts-jest/presets/js-with-ts", // or other ESM presets
    testEnvironment: "node",
    transform: {
        // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
        // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                useESM: true,
                tsconfig: {
                    baseUrl: "./",
                    paths: {
                        "graphql-service": [".symlinks/graphql-service"],
                        "graphql-service/*": [".symlinks/graphql-service/*"],
                    },
                },
            },
        ],
    },
    roots: ["<rootDir>"],
    modulePaths: ["./"],
    moduleNameMapper: pathsToModuleNameMapper({
        "graphql-service": [".symlinks/graphql-service"],
        "graphql-service/*": [".symlinks/graphql-service/*"],
    }),
    transformIgnorePatterns: ["/node_modules/(?!(chalk|graphql-service|@apollo|ts-invariant|node-fetch)/)"],
    modulePathIgnorePatterns: ["dist"],
};

export default jestConfig;
