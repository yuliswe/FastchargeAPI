import { fastcharge, getOpenerSpy, mockWaitForRemoteSecret } from "tests/utils";

describe("fastcharge account addmoney --help", () => {
  it("prints help", async () => {
    const { stdout, exitCode } = await fastcharge(["account", "addmoney", "--help"]);
    expect(stdout.getOutput()).toMatchSnapshot();
    expect(exitCode).toBe(0);
  });
});

describe("fastcharge account addmoney", () => {
  it("opens url and waits for user to complete payment", async () => {
    const openerSpy = getOpenerSpy();
    await mockWaitForRemoteSecret({
      setRemoteSecretValue: {
        status: "success",
      },
    });
    const { stdout, exitCode } = await fastcharge(["account", "addmoney", "--amount", "1000"]);
    expect(
      stdout.getOutput({
        redactWord: { URL: (w) => w.includes("https://") },
      })
    ).toMatchSnapshot();
    const openerUrl = new URL((openerSpy.mock.lastCall?.[0] as string | undefined) ?? "");
    const query = Object.fromEntries(openerUrl.searchParams.entries());
    expect(query).toMatchSnapshotExceptForProps({
      key: expect.any(String),
      jwt: expect.any(String),
      jwe: expect.any(String),
    });
    expect(exitCode).toBe(0);
  });
});
