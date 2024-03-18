import { TransformDate } from "@/src/database/transformers/Date";
import { Attribute } from "@typedorm/common";

export abstract class EntityId {
  abstract __type: string;
  constructor(public value: string) {}
}

export abstract class BaseEntity {
  @Attribute({
    autoUpdate: true,
    default: () => new Date(),
  })
  @TransformDate()
  updatedAt: Date;

  @Attribute({
    default: () => new Date(),
  })
  @TransformDate()
  createdAt: Date;
}
