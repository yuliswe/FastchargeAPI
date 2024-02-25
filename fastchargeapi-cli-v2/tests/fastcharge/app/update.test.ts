import { User } from "@/src/database/models/User";
import { AppPK } from "@/src/pks/AppPK";
import { UserPK } from "@/src/pks/UserPK";
import { createTestApp } from "@/tests/test-data/App";
import { createTestUser } from "@/tests/test-data/User";
import { baseRequestContext as context } from "@/tests/test-utils/test-utils";
import { fastcharge, mockLoggedInAsUser } from "tests/utils";

describe("fastcharge app update --help", () => {
  it("prints help message", async () => {
    const { stdout, exitCode } = await fastcharge(["app", "update", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout.getOutput()).toMatchSnapshot();
  });
});

describe("fastcharge app update", () => {
  let testUser: User;

  beforeEach(async () => {
    testUser = await createTestUser(context);
    await mockLoggedInAsUser(testUser);
  });

  it("updates an app", async () => {
    const testApp = await createTestApp(context, { owner: UserPK.stringify(testUser) });
    const updateProps = {
      "--description": "New description",
      "--title": "New title",
      "--repository": "https://new-repo.com",
      "--homepage": "https://new-homepage.com",
      "--logo": "https://new-logo.com",
      "--readme": "https://new-readme.com",
      "--visibility": "private",
    };
    const { stdout, exitCode } = await fastcharge([
      "app",
      "update",
      AppPK.stringify(testApp),
      ...Object.entries(updateProps).flat(),
    ]);
    expect(
      stdout.getOutput({
        redactWord: { appName: (word) => word.startsWith("testapp-") },
      })
    ).toMatchSnapshot();
    expect(exitCode).toBe(0);
    const updatedTestApp = await context.batched.App.get(AppPK.extract(testApp));
    expect(updatedTestApp).toMatchSnapshotExceptForProps({
      owner: UserPK.stringify(testUser),
      name: testApp.name,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });
});
