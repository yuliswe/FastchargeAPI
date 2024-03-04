import { UserPK } from "@/src/pks/UserPK";
import { addMoneyForUser, baseRequestContext as context } from "@/tests/test-utils/test-utils";
import { fastcharge, loginAsNewTestUser } from "tests/utils";

describe("fastcharge account withdraw --help", () => {
  it("prints help", async () => {
    const { stdout, exitCode } = await fastcharge(["account", "withdraw", "--help"]);
    expect(stdout.getOutput()).toMatchSnapshot();
    expect(exitCode).toBe(0);
  });
});

describe("fastcharge account withdraw", () => {
  it("prints error when user has insufficient funds", async () => {
    await loginAsNewTestUser(context);
    const { stdout, exitCode } = await fastcharge(["account", "withdraw", "--amount", "1000"]);
    expect(stdout.getOutput()).toMatchSnapshot();
    expect(exitCode).toBe(1);
  });

  it("prints error when user withdraw a very small amount", async () => {
    const testUser = await loginAsNewTestUser(context);
    await addMoneyForUser(context, {
      amount: "1",
      user: UserPK.stringify(testUser),
    });
    const { stdout, exitCode } = await fastcharge(["account", "withdraw", "--amount", "0.01"]);
    expect(stdout.getOutput()).toMatchSnapshot();
    expect(exitCode).toBe(1);
  });

  it("withdraws money succesfully", async () => {
    const testUser = await loginAsNewTestUser(context);
    await addMoneyForUser(context, {
      amount: "1000",
      user: UserPK.stringify(testUser),
    });
    const { stdout, exitCode } = await fastcharge(["account", "withdraw", "--amount", "1000", "-y"]);
    expect(stdout.getOutput()).toMatchSnapshot();
    expect(exitCode).toBe(0);
  });
});
