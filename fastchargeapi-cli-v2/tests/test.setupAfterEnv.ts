import fs from "fs/promises";
import os from "os";
import path from "path";
import process from "process";

async function createTestTempDir() {
  return await fs.mkdtemp(path.join(__dirname, "__tests_temp__", "testcase-"));
}

jest.mock("opener", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
}));

beforeEach(async () => {
  process.chdir(path.join(__dirname, "__tests_temp__"));
  const cwd = await createTestTempDir();
  process.env.HOME = cwd;
  process.env.AWS_CONFIG_FILE = path.join(os.homedir(), ".aws", "config");
  process.env.AWS_SHARED_CREDENTIALS_FILE = path.join(os.homedir(), ".aws", "credentials");
  jest.spyOn(os, "homedir").mockReturnValue(cwd);
});

afterEach(() => {
  jest.clearAllTimers();
  jest.clearAllMocks();
  jest.restoreAllMocks();
});
