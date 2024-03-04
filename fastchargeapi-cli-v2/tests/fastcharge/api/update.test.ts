import type { App } from "@/src/database/models/App";
import type { Endpoint } from "@/src/database/models/Endpoint";
import type { User } from "@/src/database/models/User";
import { AppPK } from "@/src/pks/AppPK";
import { EndpointPK } from "@/src/pks/EndpointPK";
import { UserPK } from "@/src/pks/UserPK";
import { createTestApp } from "@/tests/test-data/App";
import { createTestEndpoint } from "@/tests/test-data/Endpoint";
import { baseRequestContext as context } from "@/tests/test-utils/test-utils";
import { fastcharge, loginAsNewTestUser } from "tests/utils";

describe("fastcharge api update --help", () => {
  it("prints help", async () => {
    const { stdout, exitCode } = await fastcharge(["api", "update", "--help"]);
    expect(stdout.getOutput()).toMatchSnapshot();
    expect(exitCode).toBe(0);
  });
});

describe("fastcharge api update", () => {
  let testUser: User;
  let testApp: App;
  let testEndpoint: Endpoint;

  beforeEach(async () => {
    testUser = await loginAsNewTestUser(context);
    testApp = await createTestApp(context, { owner: UserPK.stringify(testUser) });
    testEndpoint = await createTestEndpoint(context, { app: AppPK.stringify(testApp) });
  });

  it("updates endpoint successfully", async () => {
    const { stdout, exitCode } = await fastcharge([
      "api",
      "update",
      EndpointPK.stringify(testEndpoint),
      "--method=POST",
      "--path=/new-test-path",
      "--destination='http://new-example.com'",
      "--description='New description",
    ]);
    const updated = await context.batched.Endpoint.getOrNull({
      app: AppPK.stringify(testApp),
    });
    expect(updated).toMatchSnapshotExceptForProps({
      app: AppPK.stringify(testApp),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      rangeKey: expect.any(String),
    });
    expect(stdout.getOutput()).toMatchSnapshot();
    expect(exitCode).toBe(0);
  });
});
