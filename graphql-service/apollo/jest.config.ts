import { JestConfigWithTsJest, pathsToModuleNameMapper } from "ts-jest";
import { compilerOptions } from "./tsconfig.json";

const jestConfig: JestConfigWithTsJest = {
    // [...]
    preset: "ts-jest/presets/js-with-ts-esm", // or other ESM presets
    testEnvironment: "node",
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                useESM: true,
            },
        ],
    },
    modulePaths: [compilerOptions.baseUrl],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
    transformIgnorePatterns: ["/node_modules/(?!(chalk)/)"],
    modulePathIgnorePatterns: ["dist"],
    testTimeout: 120_000,
};

export default jestConfig;
