/* eslint-disable jest/no-export */
import { getParameterFromAWSSystemsManager } from "@/functions/aws";
import { tiChecker } from "src/tiChecker";
import { AuthFileContent } from "src/types/authFile";
import { verifyOrRefreshIdToken } from "src/utils/authFile";

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
  const mock = jest.spyOn(global.console, "log");
  return {
    mock,
    getOutput(args?: { redact: Record<string, (line: string) => boolean> }) {
      const { redact = {} } = args ?? {};
      let output = "";
      for (const args of mock.mock.calls) {
        const stringifyArgs = args.map((a) => {
          const str = typeof a === "string" ? a : JSON.stringify(a);
          for (const [name, redactFn] of Object.entries(redact)) {
            if (redactFn(str)) {
              return `<REDACTED:${name}>`;
            }
          }
          return str;
        });
        output += stringifyArgs.join(" ") + "\n";
      }
      return output;
    },
  };
}
