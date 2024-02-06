import fs from "fs/promises";
import path from "path";
import process from "process";

async function createTestTempDir() {
  await fs.mkdir(path.join(__dirname, "__tests_temp__"), { recursive: true });
  return await fs.mkdtemp(path.join(__dirname, "__tests_temp__", "fastchargeapi-cli-v2-tests-"));
}

export default async function globalSetup() {
  const tmpdir = await createTestTempDir();
  process.chdir(tmpdir);
}
