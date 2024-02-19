import { JestConfigWithTsJest } from "ts-jest";
import baseJestConfig, { esmModules as baseESMModules } from "../../jest.config";

const { setupFiles, setupFilesAfterEnv } = baseJestConfig;
const esmModules = [...baseESMModules, "jose"];
const jestConfig: JestConfigWithTsJest = {
  ...baseJestConfig,
  testEnvironment: "jsdom",
  moduleNameMapper: {
    ...baseJestConfig.moduleNameMapper,
    jose: "node_modules/jose/dist/browser/index.js",
    "@remix-run/web-fetch": "node_modules/@remix-run/web-fetch/dist/lib.node.cjs",
    "@web3-storage/multipart-parser": "node_modules/@web3-storage/multipart-parser/cjs/src/index.js",
  },
  transformIgnorePatterns: [`.*/node_modules/(?!(${esmModules.join("|")})/)`],
  globalSetup: "<rootDir>/tests/test.globalSetup.ts",
  globalTeardown: "<rootDir>/tests/test.globalTeardown.ts",
  setupFiles: [...(setupFiles ?? []), "<rootDir>/tests/test.setupBeforeEnv.ts"],
  setupFilesAfterEnv: [...(setupFilesAfterEnv ?? []), "<rootDir>/tests/test.setupAfterEnv.ts"],
};

export default jestConfig;
