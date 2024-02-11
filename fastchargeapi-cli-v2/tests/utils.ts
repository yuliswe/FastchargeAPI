/* eslint-disable jest/no-export */
import { getParameterFromAWSSystemsManager } from "@/functions/aws";
import { User } from "graphql-service-apollo/database/models/User";
import { makeFastchargeAPIIdTokenForUser } from "graphql-service-apollo/functions/user";
import { UserPK } from "graphql-service-apollo/pks/UserPK";
import { createFastapiProgram } from "src/fastapi/program";
import { createFastchargeProgram } from "src/fastcharge/program";
import { tiChecker } from "src/tiChecker";
import { AuthFileContent } from "src/types/authFile";
import * as authFileModule from "src/utils/authFile";
import { verifyOrRefreshIdToken } from "src/utils/authFile";
import * as consoleModule from "src/utils/console";

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export const itIf = (condition: any, name: string, fn?: (...args: any[]) => any, timeout?: number) =>
  // eslint-disable-next-line jest/expect-expect, jest/valid-title, jest/no-disabled-tests
  condition ? it(name, fn, timeout) : it.skip(name, fn, timeout);

export async function getAdminUserCredentials(): Promise<AuthFileContent> {
  const content = await getParameterFromAWSSystemsManager("cli.testing.admin_user_credentials.v2");
  if (!content) {
    throw new Error("Failed to get admin user credentials from cloud");
  }
  const maybeExpiredTokens = tiChecker.AuthFileContent.from(JSON.parse(content));
  const maybeNewTokens = await verifyOrRefreshIdToken(maybeExpiredTokens);
  return {
    ...maybeExpiredTokens,
    ...maybeNewTokens,
  };
}

export type ConsoleLogSpy = ReturnType<typeof createConsoleLogSpy>;
export function createConsoleLogSpy() {
  const mock = jest.spyOn(consoleModule, "print").mockImplementation();
  return {
    mock,
    getOutput(args?: {
      redactLine?: Record<string, (line: string) => boolean>;
      redactWord?: Record<string, (word: string) => boolean>;
    }) {
      const { redactLine: redact, redactWord } = args ?? {};
      return mock.mock.calls
        .map(([str]) =>
          str
            .split("\n")
            .map((line) => {
              const maybeRedact = Object.entries(redact ?? {}).find(([_, redactFn]) => redactFn(line));
              if (maybeRedact) {
                const [name] = maybeRedact;
                return `<REDACTED:${name}>`;
              } else {
                const redactedWords = line.split(" ").map((word) => {
                  const maybeRedact = Object.entries(redactWord ?? {}).find(([_, redactFn]) => redactFn(word));
                  if (maybeRedact) {
                    const [name] = maybeRedact;
                    return `<REDACTED:${name}>`;
                  }
                  return word;
                });
                return redactedWords.join(" ");
              }
            })
            .join("\n")
        )
        .join("");
    },
  };
}

export async function mockLoggedInAsUser(user: User) {
  const token = await makeFastchargeAPIIdTokenForUser({ user, expireInSeconds: 3600 });
  jest.spyOn(authFileModule, "readAuthFile").mockResolvedValue({
    userPK: UserPK.stringify(user),
    email: user.email,
    issuer: "fastchargeapi",
    idToken: token,
    refreshToken: "",
  });
}

class ExitCalled extends Error {
  constructor(public exitCode: number) {
    super(`process.exit() was called with ${exitCode}.`);
  }
}

export async function fastcharge(args: string[]) {
  const stdout = createConsoleLogSpy();
  const program = createFastchargeProgram();
  jest.spyOn(process, "exit").mockImplementation((exitCode: number) => {
    throw new ExitCalled(exitCode);
  });
  try {
    await program.parseAsync(args, { from: "user" });
    return { stdout, exitCode: 0 };
  } catch (e) {
    if (e instanceof ExitCalled) {
      return { stdout, exitCode: e.exitCode };
    }
    throw e;
  }
}

export async function fastapi(args: string[]) {
  const stdout = createConsoleLogSpy();
  const program = createFastapiProgram();
  jest.spyOn(process, "exit").mockImplementation((exitCode: number) => {
    throw new ExitCalled(exitCode);
  });
  try {
    await program.parseAsync(args, { from: "user" });
    return { stdout, exitCode: 0 };
  } catch (e) {
    if (e instanceof ExitCalled) {
      return { stdout, exitCode: e.exitCode };
    }
    throw e;
  }
}
