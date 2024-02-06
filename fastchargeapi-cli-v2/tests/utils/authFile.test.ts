import fs from "fs/promises";
import os from "os";
import path from "path";
import { AuthFileContent } from "src/types/authFile";
import {
  deleteAuthFile,
  getAuthFilePath,
  getGoogleCert,
  listAuthFiles,
  readAuthFile,
  refreshIdToken,
  verifyIdToken,
  writeToAuthFile,
} from "src/utils/authFile";
import { getExampleAuthFileContent } from "tests/example-data/authFile";
import { getAdminUserCredentials } from "tests/utils";

describe("getAuthFilePath", () => {
  it("returns the correct path", () => {
    expect(getAuthFilePath()).toEqual(path.join(os.homedir(), ".fastcharge", "auth.json"));
    expect(getAuthFilePath("myprofile")).toEqual(path.join(os.homedir(), ".fastcharge", "auth.myprofile.json"));
  });
});

describe("listAuthFiles", () => {
  it("returns the correct files", async () => {
    const file1 = path.join(os.homedir(), ".fastcharge", "auth.json");
    const file2 = path.join(os.homedir(), ".fastcharge", "auth.myprofile.json");
    await fs.mkdir(path.join(os.homedir(), ".fastcharge"));
    await fs.writeFile(file1, "");
    await fs.writeFile(file2, "");
    const files = await listAuthFiles();
    expect(files).toContain(file1);
    expect(files).toContain(file2);
  });

  it("does not throw if .fastcharge directory is not found", async () => {
    await expect(listAuthFiles()).resolves.toEqual([]);
  });
});

describe("getGoogleCert", () => {
  it("returns the correct cert", async () => {
    const cert = await getGoogleCert();
    expect(JSON.stringify(cert)).toContain("-----BEGIN CERTIFICATE-----");
  });
});

describe("deleteAuthFile", () => {
  it("deletes the correct file", async () => {
    const file1 = path.join(os.homedir(), ".fastcharge", "auth.json");
    const file2 = path.join(os.homedir(), ".fastcharge", "auth.myprofile.json");
    await fs.mkdir(path.join(os.homedir(), ".fastcharge"));
    await fs.writeFile(file1, "");
    await fs.writeFile(file2, "");
    await fs.access(file1);
    await fs.access(file2);
    await deleteAuthFile();
    await deleteAuthFile("myprofile");
    await expect(fs.access(file1)).rejects.toThrow();
    await expect(fs.access(file2)).rejects.toThrow();
  });
});

describe("readAuthFile", () => {
  it("returns the correct content", async () => {
    const file1 = path.join(os.homedir(), ".fastcharge", "auth.json");
    const file2 = path.join(os.homedir(), ".fastcharge", "auth.myprofile.json");
    await fs.mkdir(path.join(os.homedir(), ".fastcharge"));
    await fs.writeFile(file1, JSON.stringify(getExampleAuthFileContent(), null, 2));
    await fs.writeFile(file2, JSON.stringify(getExampleAuthFileContent(), null, 2));
    const content1 = await readAuthFile();
    const content2 = await readAuthFile("myprofile");
    expect(content1).toMatchObject(getExampleAuthFileContent());
    expect(content2).toMatchObject(getExampleAuthFileContent());
  });

  it("reject malformed content", async () => {
    const file1 = path.join(os.homedir(), ".fastcharge", "auth.json");
    await fs.mkdir(path.join(os.homedir(), ".fastcharge"));
    await fs.writeFile(file1, "");
    await expect(readAuthFile()).rejects.toThrow();
  });
});

describe("writeToAuthFile", () => {
  it("writes the correct content", async () => {
    const file1 = path.join(os.homedir(), ".fastcharge", "auth.json");
    const file2 = path.join(os.homedir(), ".fastcharge", "auth.myprofile.json");
    await writeToAuthFile(undefined, getExampleAuthFileContent());
    await writeToAuthFile("myprofile", getExampleAuthFileContent());
    const content1 = await fs.readFile(file1, "utf-8");
    const content2 = await fs.readFile(file2, "utf-8");
    expect(JSON.parse(content1)).toMatchObject(getExampleAuthFileContent());
    expect(JSON.parse(content2)).toMatchObject(getExampleAuthFileContent());
  });

  it("throws if the content is incomplete", async () => {
    await expect(writeToAuthFile(undefined, {})).rejects.toMatchSnapshot();
  });
});

describe("verifyIdToken", () => {
  let adminUserCredentials: AuthFileContent;

  beforeAll(async () => {
    adminUserCredentials = await getAdminUserCredentials();
  });

  it("verifies the token", async () => {
    const result = await verifyIdToken(adminUserCredentials.idToken);
    expect(result).toMatchObject({
      email: expect.any(String),
    });
  });
});

describe("refreshIdToken", () => {
  it("refreshes the token", async () => {
    const adminUserCredentials = await getAdminUserCredentials();
    const result = await refreshIdToken(adminUserCredentials.refreshToken);
    expect(result).toMatchObject({
      idToken: expect.any(String),
      refreshToken: expect.any(String),
    });
  });
});
