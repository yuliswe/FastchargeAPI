import { AppPK } from "@/src/pks/AppPK";
import { UserPK } from "@/src/pks/UserPK";
import { createTestApp } from "@/tests/test-data/App";
import { baseRequestContext as context } from "@/tests/test-utils/test-utils";
import { fastcharge, loginAsNewTestUser } from "tests/utils";

describe("fastcharge api add --help", () => {
  it("prints help", async () => {
    const { stdout, exitCode } = await fastcharge(["api", "add", "--help"]);
    expect(stdout.getOutput()).toMatchSnapshot();
    expect(exitCode).toBe(0);
  });
});

describe("fastcharge api add", () => {
  it("creates endpint successfully", async () => {
    const testUser = await loginAsNewTestUser(context);
    const testApp = await createTestApp(context, {
      owner: UserPK.stringify(testUser),
    });
    const { stdout, exitCode } = await fastcharge([
      "api",
      "add",
      "--app",
      testApp.name,
      "--method=GET",
      "--path=/test",
      "--destination='http://example.com'",
    ]);
    expect(stdout.getOutput()).toMatchSnapshot();
    expect(exitCode).toBe(0);
    const endpointCreated = await context.batched.Endpoint.getOrNull({
      app: AppPK.stringify(testApp),
    });
    expect(endpointCreated).toMatchSnapshotExceptForProps({
      app: AppPK.stringify(testApp),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      rangeKey: expect.any(String),
    });
  });

  it("prints error when app does not exist", async () => {
    await loginAsNewTestUser(context);
    const { stdout, exitCode } = await fastcharge([
      "api",
      "add",
      "--app=test-app",
      "--method=GET",
      "--path=/test",
      "--destination='http://example.com'",
    ]);
    expect(stdout.getOutput()).toMatchSnapshot();
    expect(exitCode).toBe(1);
  });
});
