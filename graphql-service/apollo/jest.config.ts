import { readFileSync } from "fs";
import * as json5 from "json5";
import { JestConfigWithTsJest, pathsToModuleNameMapper } from "ts-jest";
import { CompilerOptions } from "typescript";

const tsconfig = json5.parse<{ compilerOptions: CompilerOptions }>(
    readFileSync("./tsconfig.json", {
        encoding: "utf8",
    })
);

const { compilerOptions } = tsconfig;

const jestConfig: JestConfigWithTsJest = {
    preset: "ts-jest/presets/js-with-ts-esm", // or other ESM presets
    testEnvironment: "node",
    setupFiles: ["./tests/test.env.ts"],
    setupFilesAfterEnv: ["jest-extended/all", "./tests/test.setupAfterEnv.ts"], // runs before every test suite
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
    modulePaths: [compilerOptions.baseUrl ?? "./"],
    moduleNameMapper: pathsToModuleNameMapper({
        ...compilerOptions.paths,
        "@/*": ["*"],
    }),
    transformIgnorePatterns: ["/node_modules/(?!(chalk)/)"],
    modulePathIgnorePatterns: ["dist"],
    testTimeout: 120_000,
    coverageDirectory: ".coverage",
    coverageReporters: ["lcov"],
    maxWorkers: "50%",
    randomize: true,
};

export default jestConfig;
