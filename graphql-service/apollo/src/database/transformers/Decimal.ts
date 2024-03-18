import { Attribute, TransformFromDynamo, TransformToDynamo } from "@typedorm/common";
import Decimal from "decimal.js-light";

const DecimalToDynamo = (arg: { value?: Decimal }) => {
  const { value } = arg;
  return value?.toString();
};

const DecimalFromDynamo = (arg: { value?: string }) => {
  const { value } = arg;
  return value ? new Decimal(value) : undefined;
};

export function TransformDecimal() {
  return (target: object, propertyKey: string) => {
    Attribute()(target, propertyKey);
    TransformToDynamo(DecimalToDynamo)(target, propertyKey);
    TransformFromDynamo(DecimalFromDynamo)(target, propertyKey);
  };
}
