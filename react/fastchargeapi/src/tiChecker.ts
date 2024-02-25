import envCheckers from "src/__generated__/env-ti";
import type * as env from "src/ti-types/env";
import { Checker, IErrorDetail, createCheckers } from "ts-interface-checker";

/**
 * How to add a new type to the tiChecker:
 *
 * 1. Create a new type in the types directory, for example `src/types/myType.ts`.
 * 2. Generates new ti file in the __generated__ directory, for example `src/__generated__/myType-ti.ts`.
 * 3. Add `import type * as myType from "src/types/myType";`
 * 4. Add `import myTypeCheckers from "src/__generated__/myType-ti";`
 * 5. Add `...myTypeCheckers` to the `checkers` object.
 * 6. Add `MyType: TypedChecker<myType.MyType>` to the `TypedCheckers` type.
 */

const checkers = {
  ...envCheckers,
};

type TypedChecker<T> = Checker & {
  from: (v: unknown) => T;
  fromArray: (v: unknown) => T[];
  strictFrom: (v: unknown) => T;
  strictFromArray: (v: unknown) => T[];
};

type TypedCheckers = {
  EnvVars: TypedChecker<env.EnvVars>;
};

function from<T>(value: unknown, checker: TypedChecker<T>, opts: { strict: boolean }): T {
  const { strict } = opts;
  if (Array.isArray(value)) {
    throw new Error(`Expected non-array, got array: ${JSON.stringify(value)}`);
  }
  const errors = strict ? checker.strictValidate(value) : checker.validate(value);
  if (errors !== null) {
    let msg = "Validation failed:\n";
    const flatten = (e: IErrorDetail): IErrorDetail[] => (e.nested ? e.nested.flatMap(flatten) : [e]);
    for (const { path, message } of flatten(errors)) {
      msg += `  ${path} ${message}\n`;
    }
    msg += `\nValue: ${JSON.stringify(value, null, 2)}`;
    throw new Error(msg);
  }
  return value as T;
}

function fromArray<T>(value: unknown, checker: TypedChecker<T>, opts: { strict: boolean }): T[] {
  const { strict } = opts;
  if (!Array.isArray(value)) {
    throw new Error(`Expected array, got: ${JSON.stringify(value, null, 2)}`);
  }
  const flatten = (e: IErrorDetail): IErrorDetail[] => (e.nested ? e.nested.flatMap(flatten) : [e]);
  for (const v of value) {
    const errors = strict ? checker.strictValidate(v) : checker.validate(v);
    if (errors !== null) {
      let msg = "Validation failed:\n";
      for (const { path, message } of flatten(errors)) {
        msg += `  ${path} ${message}\n`;
      }
      msg += `Value: ${JSON.stringify(value, null, 2)}\n`;
      throw new Error(msg);
    }
  }
  return value as T[];
}

export const tiChecker = Object.fromEntries(
  Object.entries(createCheckers(checkers)).map(([k, checker]) => {
    checker.setReportedPath("");
    return [
      k,
      {
        ...checker,
        from: <T>(value: unknown): T => from(value, checker as TypedChecker<T>, { strict: false }),
        fromArray: <T>(value: unknown): T[] => fromArray(value, checker as TypedChecker<T>, { strict: false }),
        strictFrom: <T>(value: unknown): T => from(value, checker as TypedChecker<T>, { strict: true }),
        strictFromArray: <T>(value: unknown): T[] => fromArray(value, checker as TypedChecker<T>, { strict: true }),
      },
    ];
  })
) as TypedCheckers;
