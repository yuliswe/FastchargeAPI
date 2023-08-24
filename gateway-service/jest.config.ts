import { JestConfigWithTsJest, pathsToModuleNameMapper } from "ts-jest";
import { compilerOptions } from "./tsconfig.json";

const jestConfig: JestConfigWithTsJest = {
    preset: "ts-jest/presets/js-with-ts", // or other ESM presets
    testEnvironment: "node",
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                useESM: true,
            },
        ],
        "^.+\\.graphql$": ["@glen/jest-raw-loader", {}],
        "^.+\\.hbs$": ["@glen/jest-raw-loader", {}],
    },
    roots: ["<rootDir>"],
    modulePaths: [compilerOptions.baseUrl],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
    transformIgnorePatterns: ["/node_modules/(?!(chalk|graphql-service|@apollo|ts-invariant|node-fetch)/)"],
    modulePathIgnorePatterns: ["dist"],
    setupFilesAfterEnv: ["<rootDir>/tests/test.env.ts", "<rootDir>/tests/test.setupAfterEnv.ts"],
    coverageDirectory: ".coverage",
    coverageReporters: ["text", "html", "lcov"],
};

export default jestConfig;
