import { startStandaloneServer } from "@apollo/server/standalone";
import { server } from "./server";
import { RequestContext, createDefaultContextBatched } from "./RequestContext";
import { GQLUserIndex } from "./__generated__/resolvers-types";
import { createUserWithEmail } from "./functions/user";

let { url } = await startStandaloneServer<RequestContext>(server, {
    listen: {
        port: process.env.PORT ? Number.parseInt(process.env.PORT) : 4000,
    },
    context: async ({ req }) => {
        // Note: You must not trust the header in production. This is just for
        // development.
        let email = (req.headers["X-User-Email"] || req.headers["x-user-email"]) as string | undefined;
        // The batcher must be created for every request in order for it to
        // function properly.
        let batched = createDefaultContextBatched();
        if (!email) {
            throw new Error("X-User-Email header is missing.");
        }
        let currentUser = await batched.User.getOrNull(
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
        return Promise.resolve({
            currentUser,
            batched,
            isServiceRequest: false,
            isSQSMessage: false,
            isAnonymousUser: email == undefined,
        });
    },
});

console.log("Server ready at: " + url);
