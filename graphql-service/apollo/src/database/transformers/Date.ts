import { TransformFromDynamo, TransformToDynamo } from "@typedorm/common";

const DateToDynamo = (arg: { value?: Date | string }) => {
  if (typeof arg.value === "string") {
    return arg.value;
  }
  return arg.value?.toISOString();
};

const DateFromDynamo = (arg: { value?: string }) => {
  const { value } = arg;
  return value ? new Date(value) : undefined;
};

export function TransformDate() {
  return (target: object, propertyKey: string) => {
    TransformToDynamo(DateToDynamo)(target, propertyKey);
    TransformFromDynamo(DateFromDynamo)(target, propertyKey);
  };
}
