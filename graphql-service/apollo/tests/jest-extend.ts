import { expect } from "@jest/globals";
import { AsymmetricMatcher } from "expect";

function isMatcher(value: unknown): value is AsymmetricMatcher<unknown> {
  return typeof value === "object" && value !== null && "asymmetricMatch" in value;
}

export function expectToMatchSnapshotExceptForProps<T>(object: T, matcher: Partial<{ [P in keyof T]: any }>) {
  expect(object).toMatchObject(matcher);

  const recursivelyApply = (subObj: unknown): unknown => {
    if (subObj === null) {
      return null;
    }
    if (subObj === undefined) {
      return undefined;
    }
    if (typeof subObj === "number") {
      return expect.any(Number);
    }
    if (typeof subObj === "string") {
      return expect.any(String);
    }
    if (typeof subObj === "boolean") {
      return expect.any(Boolean);
    }
    if (Array.isArray(subObj)) {
      return expect.arrayContaining(subObj.map(recursivelyApply));
    }
    if (isMatcher(subObj)) {
      const type = subObj.getExpectedType?.();
      switch (type) {
        case "number":
          return expect.any(Number);
        case "string":
          return expect.any(String);
        case "boolean":
          return expect.any(Boolean);
        default:
          throw new Error(`Unexpected type ${type}`);
      }
    }
    if (typeof subObj === "object") {
      const result: { [key: string]: unknown } = {};
      for (const key of Object.keys(subObj)) {
        result[key] = recursivelyApply((subObj as Record<string, unknown>)[key]);
      }
      return result;
    }
    throw new Error(`Unexpected type ${typeof subObj}`);
  };

  expect(object).toMatchSnapshot(recursivelyApply(matcher) as Partial<{ [P in keyof T]: any }>);
}

export function extendJest() {
  expect.extend({
    toMatchSnapshotExceptForProps<T>(received: T, matcher: Partial<{ [P in keyof T]: any }>) {
      expectToMatchSnapshotExceptForProps(received, matcher);
      return { pass: true, message: () => "" };
    },

    toEqualStringArrayIgnoringOrder(received: string[], expected: string[]) {
      const sortfn = (a: string, b: string) => a.localeCompare(b);
      expect(received.sort(sortfn)).toEqual(expected.sort(sortfn));
      return { pass: true, message: () => "" };
    },
  });
}
