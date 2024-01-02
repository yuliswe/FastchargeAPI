import { JestConfigWithTsJest } from "ts-jest";
import baseJestConfig from "../jest.config";

const { setupFiles } = baseJestConfig;
const jestConfig: JestConfigWithTsJest = {
  ...baseJestConfig,
  setupFiles: [...(setupFiles ?? []), `./tests/test.env.ts`],
};

export default jestConfig;
