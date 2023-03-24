import { startStandaloneServer } from "@apollo/server/standalone";
import { server } from "./server";
import { RequestContext, createDefaultContextBatched } from "./RequestContext";
import { GQLUserIndex } from "./__generated__/resolvers-types";
import { createUserWithEmail } from "./functions/user";
import { UserPK } from "./pks/UserPK";
import { User } from "./dynamoose/models";

let { url } = await startStandaloneServer<RequestContext>(server, {
    listen: {
        port: process.env.PORT ? Number.parseInt(process.env.PORT) : 4000,
    },
    context: async ({ req }) => {
        // Note: You must not trust the header in production. This is just for
        // development.
        let reqHeaders = {} as { [key: string]: string };
        for (let key in req.headers) {
            reqHeaders[key.toLowerCase()] = req.headers[key] as string;
        }
        let email = reqHeaders["x-user-email"] as string | undefined;
        let userPK = reqHeaders["x-user-pk"] as string | undefined;
        let serviceName = reqHeaders["x-service-name"] as string | undefined;
        // The batcher must be created for every request in order for it to
        // function properly.
        let batched = createDefaultContextBatched();
        if (!email && !userPK) {
            throw new Error("Need to set X-User-Email or X-User-PK header.");
        }
        let currentUser: User | null = null;
        if (userPK) {
            currentUser = await batched.User.getOrNull(UserPK.parse(userPK));
            if (currentUser === null) {
                throw new Error("User not found: " + userPK);
            }
        } else if (email) {
            currentUser = await batched.User.getOrNull(
                {
                    email: email,
                },
                {
                    using: GQLUserIndex.IndexByEmailOnlyPk,
                }
            );
            if (currentUser === null) {
                currentUser = await createUserWithEmail(batched, email);
            }
        }
        return Promise.resolve({
            currentUser: currentUser ?? undefined,
            batched,
            isServiceRequest: serviceName != undefined,
            isSQSMessage: false,
            isAnonymousUser: email == undefined,
        });
    },
});

console.log("Server ready at: " + url);
