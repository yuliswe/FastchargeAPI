import { User } from "@/database/models/User";
import { createTestApp } from "@/tests/test-data/App";
import { createTestUser } from "@/tests/test-data/User";
import { baseRequestContext as context } from "@/tests/test-utils/test-utils";
import { UserPK } from "graphql-service-apollo/pks/UserPK";
import { fastcharge, mockLoggedInAsUser } from "tests/utils";

describe("fastcharge app list", () => {
  let testUser: User;

  beforeEach(async () => {
    testUser = await createTestUser(context);
    await mockLoggedInAsUser(testUser);
  });

  it("prints output when user has not created any app", async () => {
    const { console, exitCode } = await fastcharge(["app", "list"]);
    expect(exitCode).toBe(0);
    expect(console.getOutput()).toMatchSnapshot();
  });

  it("prints app list", async () => {
    await Promise.all([
      createTestApp(context, { owner: UserPK.stringify(testUser) }),
      createTestApp(context, { owner: UserPK.stringify(testUser) }),
      createTestApp(context, { owner: UserPK.stringify(testUser) }),
    ]);
    const { console, exitCode } = await fastcharge(["app", "list"]);
    expect(exitCode).toBe(0);
    expect(
      console.getOutput({
        redact: {
          AppName: (line) => line.includes("testapp-"),
        },
      })
    ).toMatchSnapshot();
  });
});
