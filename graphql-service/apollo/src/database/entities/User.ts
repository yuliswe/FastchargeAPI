import { BaseEntity, EntityId } from "@/src/database/entities/BaseEntity";
import type { UserCreateProps } from "@/src/database/models/User";
import { TransformDecimal } from "@/src/database/transformers/Decimal";
import { TransformEntityId } from "@/src/database/transformers/EntityId";
import { EntityWithTable } from "@/src/database/typedorm";
import { Attribute, INDEX_TYPE } from "@typedorm/common";
import type Decimal from "decimal.js-light";

class UserId extends EntityId {
  __type = "UserId" as const;
}

@EntityWithTable({
  name: "User",
  partitionKey: "uid",
  indexes: {
    indexByEmail__onlyPK: {
      type: INDEX_TYPE.GSI,
      partitionKey: "email",
      sortKey: "email",
    },
  },
})
export class User extends BaseEntity {
  @TransformEntityId(UserId)
  id: UserId;

  @Attribute()
  uid: string;

  @Attribute()
  email: string;

  @Attribute({
    default: () => `user_${Math.floor(Math.random() * 10000000)}`,
  })
  author: string;

  /** Available after the user first tops up their account */
  @Attribute()
  stripeCustomerId: string;

  /** Available after the user first onboards their Stripe account */
  @Attribute()
  stripeConnectAccountId: string;

  @TransformDecimal()
  balanceLimit: Decimal;

  @Attribute()
  isAdmin: boolean;

  constructor(props: UserCreateProps) {
    super();
    Object.assign(this, props);
  }
}
