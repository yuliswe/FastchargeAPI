import { AuthFileContent, RefreshIdTokenResult, VerifyIdTokenResult } from "src/__generated__/authFile-ti";
import cliOptionsChckers from "src/__generated__/cliOptions-ti";
import { EnvVars } from "src/__generated__/env-ti";
import simplfiedGQLErrorsCheckers from "src/__generated__/simplfiedGQLErrors-ti";
import type * as authFile from "src/types/authFile";
import type * as cliOptions from "src/types/cliOptions";
import type * as env from "src/types/env";
import * as simplfiedGQLErrors from "src/types/simplfiedGQLErrors";
import { Checker, createCheckers } from "ts-interface-checker";

const checkers = {
  AuthFileContent,
  RefreshIdTokenResult,
  VerifyIdTokenResult,
  EnvVars,
  ...simplfiedGQLErrorsCheckers,
  ...cliOptionsChckers,
};

type TypedChecker<T> = Checker & {
  from: (v: unknown) => T;
  fromArray: (v: unknown) => T[];
  strictFrom: (v: unknown) => T;
  strictFromArray: (v: unknown) => T[];
};

type TypedCheckers = {
  AuthFileContent: TypedChecker<authFile.AuthFileContent>;
  RefreshIdTokenResult: TypedChecker<authFile.RefreshIdTokenResult>;
  VerifyIdTokenResult: TypedChecker<authFile.VerifyIdTokenResult>;
  EnvVars: TypedChecker<env.EnvVars>;
  SimplifiedGQLErrorExtensions: TypedChecker<simplfiedGQLErrors.SimplifiedGQLErrorExtensions>;
  AlreadyExistsSimpleGQLErrorExtensions: TypedChecker<simplfiedGQLErrors.AlreadyExistsSimpleGQLErrorExtensions>;
  BadUserInputSimpleGQLErrorExtensions: TypedChecker<simplfiedGQLErrors.BadUserInputSimpleGQLErrorExtensions>;
  ImmutableResourceSimpleGQLErrorExtensions: TypedChecker<simplfiedGQLErrors.ImmutableResourceSimpleGQLErrorExtensions>;
  NotFoundSimpleGQLErrorExtensions: TypedChecker<simplfiedGQLErrors.NotFoundSimpleGQLErrorExtensions>;
  PermissionDeniedSimpleGQLErrorExtensions: TypedChecker<simplfiedGQLErrors.PermissionDeniedSimpleGQLErrorExtensions>;
  TooManyResourcesSimpleGQLErrorExtensions: TypedChecker<simplfiedGQLErrors.TooManyResourcesSimpleGQLErrorExtensions>;
  ResourceDeletedSimpleGQLErrorExtensions: TypedChecker<simplfiedGQLErrors.ResourceDeletedSimpleGQLErrorExtensions>;
  CliGlobalOptions: TypedChecker<cliOptions.CliGlobalOptions>;
  CliCommonLoginCommandOptions: TypedChecker<cliOptions.CliCommonLoginCommandOptions>;
  CliCommonLogoutCommandOptions: TypedChecker<cliOptions.CliCommonLogoutCommandOptions>;
  CliFastchargeAppListCommandOptions: TypedChecker<cliOptions.CliFastchargeAppListCommandOptions>;
  CliFastchargeAppCreateCommandOptions: TypedChecker<cliOptions.CliFastchargeAppCreateCommandOptions>;
  CliFastchargeAppUpdateCommandOptions: TypedChecker<cliOptions.CliFastchargeAppUpdateCommandOptions>;
};

function from<T>(value: unknown, checker: TypedChecker<T>, opts: { strict: boolean }): T {
  const { strict } = opts;
  if (Array.isArray(value)) {
    throw new Error(`Expected non-array, got array: ${JSON.stringify(value)}`);
  }
  const errors = strict ? checker.strictValidate(value) : checker.validate(value);
  if (errors !== null) {
    let msg = "Validation failed:\n";
    for (const { path, message } of errors) {
      msg += `  ${path} ${message}\n`;
    }
    msg += `Value: ${JSON.stringify(value, null, 2)}`;
    throw new Error(msg);
  }
  return value as T;
}

function fromArray<T>(value: unknown, checker: TypedChecker<T>, opts: { strict: boolean }): T[] {
  const { strict } = opts;
  if (!Array.isArray(value)) {
    throw new Error(`Expected array, got: ${JSON.stringify(value, null, 2)}`);
  }
  for (const v of value) {
    const errors = strict ? checker.strictValidate(v) : checker.validate(v);
    if (errors !== null) {
      let msg = "Validation failed:\n";
      for (const { path, message } of errors) {
        msg += `  ${path} ${message}\n`;
      }
      msg += `Value: ${JSON.stringify(value, null, 2)}\n`;
      throw new Error(msg);
    }
  }
  return value as T[];
}

export const tiChecker = Object.fromEntries(
  Object.entries(createCheckers(checkers) as Record<keyof typeof checkers, Checker>).map(([k, checker]) => [
    k,
    {
      ...checker,
      from: <T>(value: unknown): T => from(value, checker as TypedChecker<T>, { strict: false }),
      fromArray: <T>(value: unknown): T[] => fromArray(value, checker as TypedChecker<T>, { strict: false }),
      strictFrom: <T>(value: unknown): T => from(value, checker as TypedChecker<T>, { strict: true }),
      strictFromArray: <T>(value: unknown): T[] => fromArray(value, checker as TypedChecker<T>, { strict: true }),
    },
  ])
) as TypedCheckers;
