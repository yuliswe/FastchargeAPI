import { JestConfigWithTsJest } from "ts-jest";
import baseJestConfig from "../../jest.config";

const jestConfig: JestConfigWithTsJest = {
  ...baseJestConfig,
};

export default jestConfig;
