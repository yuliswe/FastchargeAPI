/**
 * base jest configuration file
 */

import { JestConfigWithTsJest, pathsToModuleNameMapper } from "ts-jest";

const projectRoot = process.env.WS_DIR;

export const esmModules = ["chalk", "crypto-hash"];

const jestConfig: JestConfigWithTsJest = {
  preset: "ts-jest/presets/js-with-ts",
  testEnvironment: "node",
  globalSetup: `${projectRoot}/graphql-service/apollo/tests/test.globalSetup.ts`,
  globalTeardown: `${projectRoot}/graphql-service/apollo/tests/test.globalTeardown.ts`,
  setupFiles: [`${projectRoot}/graphql-service/apollo/tests/test.setupBeforeEnv.ts`],
  setupFilesAfterEnv: [
    "jest-extended/all",
    `${projectRoot}/graphql-service/apollo/tests/test.setupAfterEnv.ts`, // runs before every test suite
  ],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {}],
    "^.+\\.graphql$": ["@glen/jest-raw-loader", {}],
    "^.+\\.hbs$": ["@glen/jest-raw-loader", {}],
  },
  roots: ["<rootDir>"],
  modulePaths: ["./"],
  moduleNameMapper: {
    ".+\\.(css|styl|less|sass|scss|svg)$": "identity-obj-proxy",
    ".+\\.(jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/fileMock.js",
    ...pathsToModuleNameMapper({
      "react-markdown": ["identity-obj-proxy"],
      "rehype-*": ["identity-obj-proxy"],
      "remark-*": ["identity-obj-proxy"],
      "@fontsource/*": ["identity-obj-proxy"],
      uuid: ["node_modules/uuid/dist/index.js"],
      jose: ["node_modules/jose/dist/node/cjs/index.js"],
      "@/*": [`${projectRoot}/graphql-service/apollo/*`],
    }),
  },
  transformIgnorePatterns: [`.*/node_modules/(?!(${esmModules.join("|")})/)`],
  modulePathIgnorePatterns: ["dist"],
  testTimeout: 120_000,
  coverageDirectory: ".coverage",
  coverageReporters: ["lcov"],
  reporters: ["default", `${__dirname}/jest-reporters/jest-json-reporter.js`],
  maxWorkers: "25%",
  randomize: true,
};

export default jestConfig;
