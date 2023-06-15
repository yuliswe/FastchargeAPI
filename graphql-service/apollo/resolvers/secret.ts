import { RequestContext } from "../RequestContext";
import {
    GQLMutationCreateSecretArgs,
    GQLQuerySecretArgs,
    GQLResolvers,
    GQLSecretResolvers,
} from "../__generated__/resolvers-types";
import { Secret, SecretModel } from "../dynamoose/models";

export const secretResolvers: GQLResolvers & {
    Secret: Required<GQLSecretResolvers>;
} = {
    Secret: {
        __isTypeOf: (parent) => parent instanceof SecretModel,
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
        async secret(parent: {}, { key }: GQLQuerySecretArgs, context: RequestContext) {
            const secret = await context.batched.Secret.get({ key });
            return secret;
        },
    },
    Mutation: {
        async createSecret(parent: {}, { key, value, expireAt }: GQLMutationCreateSecretArgs, context: RequestContext) {
            const secret = await context.batched.Secret.create({
                key,
                value,
                expireAt,
            });
            return secret;
        },
    },
};
