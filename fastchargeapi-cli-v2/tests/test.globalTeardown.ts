import fs from "fs/promises";
import path from "path";

async function removeTestTempDir() {
  const symlinkToTestTempDir = path.join(__dirname, "__tests_temp__");
  try {
    await fs.rm(symlinkToTestTempDir, { recursive: true });
  } catch (e) {
    // ignore
  }
}

export default async function globalTeardown() {
  if (!process.env.NO_CLEANUP) {
    await removeTestTempDir();
  }
}
