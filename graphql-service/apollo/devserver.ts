import { startStandaloneServer } from "@apollo/server/standalone";
import { NotFound } from "./errors";
import { server } from "./server";
import { RequestContext, createDefaultContextBatched } from "./RequestContext";

let { url } = await startStandaloneServer<RequestContext>(server, {
    listen: { port: Number.parseInt(process.env.PORT) || 4000 },
    context: async ({ req }) => {
        // Note: You must not trust the header in production. This is just for
        // development.
        let email = req.headers["x-user-email"] as string;
        // The batcher must be created for every request in order for it to
        // function properly.
        let batched = createDefaultContextBatched();
        if (email) {
            try {
                let user = await batched.User.get(email);
            } catch (e) {
                if (e instanceof NotFound) {
                    await batched.User.create({
                        email: email,
                    });
                } else {
                    throw e;
                }
            }
        }
        return Promise.resolve({
            currentUser: email,
            batched,
            isServiceRequest: false,
        });
    },
});

console.log("Server ready at: " + url);
