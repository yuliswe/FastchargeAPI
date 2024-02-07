import * as loginModule from "src/common/login";
import { createFastapiProgram } from "src/fastapi/program";
import { createFastchargeProgram } from "src/fastcharge/program";
import * as remoteSecretModule from "src/utils/remoteSecret";
import { createSecretPair, setRemoteSecret } from "src/utils/remoteSecret";
import { ConsoleLogSpy, createConsoleLogSpy, getAdminUserCredentials } from "tests/utils";

jest.mock("opener", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
const uuid = jest.requireActual("uuid") as { v4: () => string };

jest.mock("uuid");

describe("loginCommand", () => {
  let consoleLogSpy: ConsoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = createConsoleLogSpy();
  });

  for (const profile of [undefined, "myprofile"]) {
    for (const program of [createFastapiProgram(), createFastchargeProgram()]) {
      // eslint-disable-next-line jest/valid-title
      it(`${program.name()} login` + (profile ? ` --profile ${profile}` : ""), async () => {
        const { jweSecret, jwtSecret } = createSecretPair();
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const key = uuid.v4();
        jest.spyOn(jest.requireMock("uuid"), "v4").mockReturnValue(key);
        jest.spyOn(remoteSecretModule, "createSecretPair").mockImplementation(() => ({
          jweSecret,
          jwtSecret,
        }));
        const loginCommandSpy = jest.spyOn(loginModule, "loginCommand");
        const openerModule = jest.requireMock("opener");
        const opener = jest.spyOn(openerModule, "default");
        const adminUserCredentials = await getAdminUserCredentials();
        await setRemoteSecret({
          key,
          value: adminUserCredentials,
          jweSecret,
          jwtSecret,
        });
        const args = ["login"];
        if (profile) {
          args.push("--profile", profile);
        }
        await program.parseAsync(args, { from: "user" });
        const url = new URL(opener.mock.lastCall?.[0] as string);
        const params = Object.fromEntries(url.searchParams.entries());
        const hex = (arr: Uint8Array) =>
          Array.from(arr)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
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
            redact: { URL: (ln) => ln.includes("https://") },
          })
        ).toMatchSnapshot("console output");
      });
    }
  }
});
