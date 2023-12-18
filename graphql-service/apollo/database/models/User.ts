import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { tableConfigs, validateStringDecimal } from "../utils";

/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.

export class User extends Item {
  uid: string;
  email: string;
  author: string;
  balance: string;
  balanceLimit: string;
  stripeCustomerId: string | null;
  stripeConnectAccountId: string | null;
  appTokens: { [appName: string]: string };
  createdAt: number;
  updatedAt: number;
}

export type UserCreateProps = {
  uid: string;
  email: string;
} & Partial<User>;

export enum UserTableIndex {
  IndexByEmailOnlyPk = "indexByEmail__onlyPK",
}

export const UserTableSchema = new dynamoose.Schema(
  {
    uid: { type: String, hashKey: true },
    email: {
      type: String,
      required: true,
      index: {
        type: "global",
        name: UserTableIndex.IndexByEmailOnlyPk,
        project: ["uid"],
      },
    },
    author: { type: String, default: () => `user_${Math.floor(Math.random() * 10000000)}` },
    stripeCustomerId: { type: String, required: false }, // Available after the user first tops up their account
    stripeConnectAccountId: { type: String, required: false }, // Available after the user first onboards their Stripe account
    balanceLimit: { type: String, default: "100", validate: validateStringDecimal("accountLimit") },
  },
  {
    timestamps: true,
  }
);

export const UserModel = dynamoose.model<User>("User", UserTableSchema, {
  ...tableConfigs,
});
