import { RequestContext } from "@/src/RequestContext";
import {
  GQLMutationCreateSecretArgs,
  GQLQueryGetSecretArgs,
  GQLResolvers,
  GQLSecretResolvers,
} from "@/src/__generated__/resolvers-types";
import { Secret, SecretModel } from "@/src/database/models/Secret";
import { SecretPK } from "@/src/pks/SecretPK";

export const SecretResolvers: GQLResolvers & {
  Secret: Required<GQLSecretResolvers>;
} = {
  Secret: {
    __isTypeOf: (parent) => parent instanceof SecretModel,
    pk: (parent) => SecretPK.stringify(parent),
    key: (parent) => parent.key,
    value: (parent) => parent.value,
    expireAt: (parent) => parent.expireAt,
    createdAt: (parent) => parent.createdAt,

    async deleteSecret(parent: Secret, args: never, context: RequestContext) {
      await context.batched.Secret.delete({ key: parent.key });
      return parent;
    },
  },
  Query: {
    async getSecret(parent: {}, { key }: GQLQueryGetSecretArgs, context: RequestContext) {
      const secret = await context.batched.Secret.get({ key });
      return secret;
    },
  },
  Mutation: {
    async createSecret(parent: {}, { key, value, expireAt }: GQLMutationCreateSecretArgs, context: RequestContext) {
      const secret = await context.batched.Secret.create({
        key,
        value,
        expireAt: expireAt ?? undefined,
      });
      return secret;
    },
  },
};
