import { JestConfigWithTsJest, pathsToModuleNameMapper } from "ts-jest";
import { compilerOptions } from "./tsconfig.json";

const jestConfig: JestConfigWithTsJest = {
    // [...]
    preset: "ts-jest/presets/js-with-ts-esm", // or other ESM presets
    testEnvironment: "node",
    setupFiles: ["./tests/test.env.ts"],
    setupFilesAfterEnv: ["./tests/test.setupAfterEnv.ts"], // runs before every test suite
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
    modulePaths: [...compilerOptions.baseUrl],
    moduleNameMapper: pathsToModuleNameMapper({
        ...compilerOptions.paths,
        "@/*": ["*"],
    }),
    transformIgnorePatterns: ["/node_modules/(?!(chalk)/)"],
    modulePathIgnorePatterns: ["dist"],
    testTimeout: 120_000,
    coverageDirectory: ".coverage",
    coverageReporters: ["lcov"],
    maxWorkers: "75%",
};

export default jestConfig;
