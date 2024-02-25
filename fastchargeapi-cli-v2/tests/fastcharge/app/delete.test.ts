import { User } from "@/src/database/models/User";
import { AppPK } from "@/src/pks/AppPK";
import { UserPK } from "@/src/pks/UserPK";
import { createTestApp } from "@/tests/test-data/App";
import { createTestUser } from "@/tests/test-data/User";
import { baseRequestContext as context } from "@/tests/test-utils/test-utils";
import { fastcharge, mockLoggedInAsUser } from "tests/utils";
import * as uuid from "uuid";

describe("fastcharge app delete --help", () => {
  it("prints help message", async () => {
    const { stdout, exitCode } = await fastcharge(["app", "delete", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout.getOutput()).toMatchSnapshot();
  });
});

describe("fastcharge app delete", () => {
  let testUser: User;

  beforeEach(async () => {
    testUser = await createTestUser(context);
    await mockLoggedInAsUser(testUser);
  });

  it("deletes app by name", async () => {
    const testApp = await createTestApp(context, { owner: UserPK.stringify(testUser), name: `testapp-${uuid.v4()}` });
    const { stdout, exitCode } = await fastcharge(["app", "delete", testApp.name]);
    expect(
      stdout.getOutput({
        redactWord: {
          appName: (line) => line.includes("testapp-"),
        },
      })
    ).toMatchSnapshot();
    expect(exitCode).toBe(0);
  });

  it("deletes app by id", async () => {
    const testApp = await createTestApp(context, { owner: UserPK.stringify(testUser), name: `testapp-${uuid.v4()}` });
    const { stdout, exitCode } = await fastcharge(["app", "delete", AppPK.stringify(testApp)]);
    expect(
      stdout.getOutput({
        redactWord: {
          appName: (line) => line.includes("testapp-"),
        },
      })
    ).toMatchSnapshot();
    expect(exitCode).toBe(0);
  });

  it("delete does not exist", async () => {
    const { stdout, exitCode } = await fastcharge(["app", "delete", `testapp-${uuid.v4()}`]);
    expect(
      stdout.getOutput({
        redactWord: {
          appName: (line) => line.includes("testapp-"),
        },
      })
    ).toMatchSnapshot();
    expect(exitCode).toBe(1);
  });
});
