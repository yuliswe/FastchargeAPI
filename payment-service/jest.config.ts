import { JestConfigWithTsJest, pathsToModuleNameMapper } from "ts-jest";
import { compilerOptions } from "./tsconfig.json";

const jestConfig: JestConfigWithTsJest = {
    preset: "ts-jest/presets/js-with-ts-esm", // or other ESM presets
    testEnvironment: "node",
    transform: {
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
    transformIgnorePatterns: ["/node_modules/(?!(chalk)/)"],
    modulePathIgnorePatterns: ["dist"],
    setupFilesAfterEnv: ["<rootDir>/tests/test.env.ts"],
};

export default jestConfig;
