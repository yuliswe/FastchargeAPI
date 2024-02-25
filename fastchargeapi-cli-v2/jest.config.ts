import { JestConfigWithTsJest } from "ts-jest";
// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import baseJestConfig from "../jest.config";

const { setupFiles, setupFilesAfterEnv } = baseJestConfig;
const jestConfig: JestConfigWithTsJest = {
  ...baseJestConfig,
  globalSetup: "<rootDir>/tests/test.globalSetup.ts",
  globalTeardown: "<rootDir>/tests/test.globalTeardown.ts",
  setupFiles: [...(setupFiles ?? []), "<rootDir>/tests/test.setupBeforeEnv.ts"],
  setupFilesAfterEnv: [...(setupFilesAfterEnv ?? []), "<rootDir>/tests/test.setupAfterEnv.ts"],
};

export default jestConfig;
