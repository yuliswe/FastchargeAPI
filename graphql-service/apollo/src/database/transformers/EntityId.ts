import type { EntityId } from "@/src/database/entities/BaseEntity";
import { Attribute, TransformFromDynamo, TransformToDynamo } from "@typedorm/common";
import { Type } from "class-transformer";
import * as uuid from "uuid";

const EntityIdToDynamo = (arg: { value?: EntityId }) => {
  return arg.value?.value;
};

function EntityIdFromDynamo(EntityId: new (value: string) => EntityId) {
  return (arg: { value?: string }) => {
    const { value } = arg;
    return value ? new EntityId(value) : undefined;
  };
}

export function TransformEntityId(EntityId: new (value: string) => EntityId) {
  return (target: object, propertyKey: string) => {
    Attribute({ default: () => new EntityId(uuid.v4()) as never })(target, propertyKey);
    Type(() => EntityId)(target, propertyKey);
    TransformToDynamo(EntityIdToDynamo)(target, propertyKey);
    TransformFromDynamo(EntityIdFromDynamo(EntityId))(target, propertyKey);
  };
}
