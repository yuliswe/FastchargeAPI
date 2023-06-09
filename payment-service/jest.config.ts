import { JestConfigWithTsJest, pathsToModuleNameMapper } from "ts-jest";
import { compilerOptions } from "./tsconfig.json";

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
            },
        ],
        ".hbs": "@glen/jest-raw-loader",
    },
    roots: ["<rootDir>"],
    modulePaths: [compilerOptions.baseUrl],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
    transformIgnorePatterns: ["/node_modules/(?!(chalk|graphql-service|@apollo|ts-invariant)/)"],
    modulePathIgnorePatterns: ["dist"],
};

export default jestConfig;
