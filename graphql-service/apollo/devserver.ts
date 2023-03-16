import { startStandaloneServer } from "@apollo/server/standalone";
import { server } from "./server";
import { RequestContext, createDefaultContextBatched } from "./RequestContext";
import { createUserIDFromEmail } from "./functions/user";

let { url } = await startStandaloneServer<RequestContext>(server, {
    listen: {
        port: process.env.PORT ? Number.parseInt(process.env.PORT) : 4000,
    },
    context: async ({ req }) => {
        // Note: You must not trust the header in production. This is just for
        // development.
        let email = req.headers["x-user-email"] as string;
        // The batcher must be created for every request in order for it to
        // function properly.
        let batched = createDefaultContextBatched();
        if (email) {
            let userID = createUserIDFromEmail(email);
            if (!(await batched.User.exists({ id: userID }))) {
                await batched.User.create({
                    id: userID,
                    email: email,
                });
            }
        }
        return Promise.resolve({
            currentUser: email,
            batched,
            isServiceRequest: false,
            isSQSMessage: false,
            isAnonymousUser: email == undefined,
        });
    },
});

console.log("Server ready at: " + url);
