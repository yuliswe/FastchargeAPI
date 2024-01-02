/**
 * base jest configuration file
 */

import { JestConfigWithTsJest, pathsToModuleNameMapper } from "ts-jest";

const projectRoot = process.env.WS_DIR;

const jestConfig: JestConfigWithTsJest = {
  preset: "ts-jest/presets/js-with-ts-esm", // or other ESM presets
  testEnvironment: "node",
  setupFiles: [`${projectRoot}/graphql-service/apollo/tests/test.env.ts`],
  setupFilesAfterEnv: [
    "jest-extended/all",
    `${projectRoot}/graphql-service/apollo/tests/test.setupAfterEnv.ts`, // runs before every test suite
  ],
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
  modulePaths: ["./"],
  moduleNameMapper: pathsToModuleNameMapper({
    "@/*": [`${projectRoot}/graphql-service/apollo/*`],
  }),
  transformIgnorePatterns: [".*/node_modules/(?!(chalk)/)"],
  modulePathIgnorePatterns: ["dist"],
  testTimeout: 120_000,
  coverageDirectory: ".coverage",
  coverageReporters: ["lcov"],
  maxWorkers: "50%",
  randomize: true,
};

export default jestConfig;
