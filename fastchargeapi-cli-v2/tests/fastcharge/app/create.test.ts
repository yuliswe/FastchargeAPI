import { User } from "@/database/models/User";
import { createTestUser } from "@/tests/test-data/User";
import { baseRequestContext as context } from "@/tests/test-utils/test-utils";
import { AppTableIndex } from "graphql-service-apollo/database/models/App";
import { UserPK } from "graphql-service-apollo/pks/UserPK";
import { fastcharge, mockLoggedInAsUser } from "tests/utils";
import * as uuid from "uuid";

describe("fastcharge app create --help", () => {
  it("prints help message", async () => {
    const { stdout, exitCode } = await fastcharge(["app", "create", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout.getOutput()).toMatchSnapshot();
  });
});

describe("fastcharge app create", () => {
  let testUser: User;

  beforeEach(async () => {
    testUser = await createTestUser(context);
    await mockLoggedInAsUser(testUser);
  });

  it("creates app", async () => {
    const userApp = await context.batched.App.getOrNull(
      {
        owner: UserPK.stringify(testUser),
      },
      {
        using: AppTableIndex.Owner,
      }
    );
    expect(userApp).toBeNull();
    const appName = `testapp-${uuid.v4()}`;
    const { stdout, exitCode } = await fastcharge(["app", "create", "--name", appName]);
    expect(
      stdout.getOutput({
        redactWord: {
          appName: (word) => word.startsWith("testapp-"),
          url: (word) => word.startsWith("http"),
        },
      })
    ).toMatchSnapshot();
    expect(exitCode).toBe(0);
    context.batched.App.clearCache();
    const createdUserApp = await context.batched.App.many(
      {
        owner: UserPK.stringify(testUser),
      },
      {
        using: AppTableIndex.Owner,
      }
    );
    expect(createdUserApp).toMatchSnapshotExceptForProps([
      {
        owner: UserPK.stringify(testUser),
        name: appName,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      },
    ]);
  });

  it("fails when creating app with invalid app name", async () => {
    const { stdout, exitCode } = await fastcharge(["app", "create", "--name", "&!#!"]);
    expect(exitCode).toBe(1);
    expect(stdout.getOutput()).toMatchSnapshot();
  });

  it("fails when creating app with long app name", async () => {
    const { stdout, exitCode } = await fastcharge(["app", "create", "--name", "a".repeat(70)]);
    expect(exitCode).toBe(1);
    expect(stdout.getOutput()).toMatchSnapshot();
  });

  it("fails when creating app with reserved app name", async () => {
    const { stdout, exitCode } = await fastcharge(["app", "create", "--name", "api"]);
    expect(exitCode).toBe(1);
    expect(stdout.getOutput()).toMatchSnapshot();
  });
});
