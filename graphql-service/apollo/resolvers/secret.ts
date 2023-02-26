import { RequestContext } from "../RequestContext";
import {
    GQLMutationCreateSecretArgs,
    GQLQuerySecretArgs,
    GQLResolvers,
    GQLSecret,
    GQLSecretResolvers,
} from "../__generated__/resolvers-types";
import { SecretModel } from "../dynamoose/models";

/**
 * Remember to add your resolver to the resolvers object in server.ts.
 *
 * Note that to make the typing work, you must also add your Models to the
 * codegen.yml file, under the mappers section.
 */

export const secretResolvers: GQLResolvers & {
    Secret: Required<GQLSecretResolvers>;
} = {
    Secret: {
        __isTypeOf: (parent) => parent instanceof SecretModel,
        key: (parent) => parent.key,
        value: (parent) => parent.value,
        expireAt: (parent) => parent.expireAt,
        createdAt: (parent) => parent.createdAt,

        async deleteSecret(
            parent: GQLSecret,
            args: never,
            context: RequestContext
        ) {
            await context.batched.Secret.delete({ key: parent.key });
            return parent;
        },
    },
    Query: {
        async secret(
            parent: never,
            { key }: GQLQuerySecretArgs,
            context: RequestContext
        ) {
            let secret = await context.batched.Secret.getOrNull({ key });
            return secret;
        },
    },
    Mutation: {
        async createSecret(
            parent: never,
            { key, value, expireAt }: GQLMutationCreateSecretArgs,
            context: RequestContext
        ) {
            let secret = await context.batched.Secret.create({
                key,
                value,
                expireAt,
            });
            return secret;
        },
    },
};
