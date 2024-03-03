import { ValidationError } from "@/src/errors";
import dynamoose from "dynamoose";
import { ModelType } from "dynamoose/dist/General";
import { Item } from "dynamoose/dist/Item";

export const NULL = dynamoose.type.NULL;

export async function enableDBLogging() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const logger = await dynamoose.logger();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  logger.providers.set(console);
}

export async function disableDBLogging() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const logger = await dynamoose.logger();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  logger.providers.set(null);
}
type Optional<T> = T | undefined | null;
export type GQLPartial<T> = {
  [K in keyof T]?: Optional<T[K]>;
};
export type PK = string;
export const defaultCreatedAt = (async () => {
  await new Promise((resolve) => setTimeout(resolve, 1));
  return Date.now();
}) as unknown as () => number;

export function String_Required_NotEmpty(fieldName: string) {
  return {
    type: String,
    required: true,
    validate: (str: string) => {
      if (!/.+/.test(str)) {
        throw new ValidationError(fieldName, "String cannot be empty", str);
      }
      return true;
    },
  };
}

export const validateStringDecimal = (fieldName: string) => (str: string) => {
  if (!/^-?\d+(\.\d+)?$/.test(str)) {
    throw new ValidationError(fieldName, `String must be a decimal number: "${str}"`, str);
  }
  return true;
};
export type Model<T extends Item> = ModelType<T>;
export { Item } from "dynamoose/dist/Item";

export const DateTime = {
  type: {
    value: Date,
    settings: {
      storage: "iso",
    },
  },
  get: (date: string) => new Date(date),
};
