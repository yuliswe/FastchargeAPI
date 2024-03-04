import * as loginModule from "src/common/login";
import { createFastapiProgram } from "src/fastapi/program";
import { createFastchargeProgram } from "src/fastcharge/program";
import { hex } from "src/utils/remoteSecret";
import {
  ConsoleLogSpy,
  createConsoleLogSpy,
  fastapi,
  fastcharge,
  getAdminUserCredentials,
  getOpenerSpy,
  mockWaitForRemoteSecret,
} from "tests/utils";

jest.mock("opener", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("fastcharge login --help", () => {
  it("prints help message", async () => {
    const { stdout, exitCode } = await fastcharge(["login", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout.getOutput()).toMatchSnapshot();
  });
});

describe("fastapi login --help", () => {
  it("prints help message", async () => {
    const { stdout, exitCode } = await fastapi(["login", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout.getOutput()).toMatchSnapshot();
  });
});

describe("loginCommand", () => {
  let consoleLogSpy: ConsoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = createConsoleLogSpy();
  });

  for (const profile of [undefined, "myprofile"]) {
    for (const program of [createFastapiProgram(), createFastchargeProgram()]) {
      // eslint-disable-next-line jest/valid-title
      it(`${program.name()} login` + (profile ? ` --profile ${profile}` : ""), async () => {
        const adminUserCredentials = await getAdminUserCredentials();
        const { jweSecret, jwtSecret, key } = await mockWaitForRemoteSecret({
          setRemoteSecretValue: adminUserCredentials,
        });
        const loginCommandSpy = jest.spyOn(loginModule, "loginCommand");
        const opener = getOpenerSpy();
        const args = ["login"];
        if (profile) {
          args.push("--profile", profile);
        }
        await program.parseAsync(args, { from: "user" });
        const url = new URL(opener.mock.lastCall?.[0] as string);
        const params = Object.fromEntries(url.searchParams.entries());
        expect(params).toMatchSnapshotExceptForProps({
          jwe: hex(jweSecret),
          jwt: hex(jwtSecret),
          key,
        });
        expect(loginCommandSpy.mock.lastCall).toMatchSnapshot(
          `loginCommand must be called with the right profile name: ${profile}`
        );
        const authFileContent = await loginCommandSpy.mock.results[0].value;
        expect(authFileContent).toMatchSnapshotExceptForProps({
          idToken: adminUserCredentials.idToken,
          refreshToken: adminUserCredentials.refreshToken,
          email: expect.any(String),
          userPK: expect.any(String),
        });
        expect(
          consoleLogSpy.getOutput({
            redactLine: { URL: (ln) => ln.includes("https://") },
          })
        ).toMatchSnapshot("console output");
      });
    }
  }
});
