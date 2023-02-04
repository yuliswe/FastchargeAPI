import { startStandaloneServer } from "@apollo/server/standalone";
import { NotFound } from "./errors";
import { createDefaultContextBatched, RequestContext, server } from "./server";

let { url } = await startStandaloneServer<RequestContext>(server, {
    listen: { port: 4000 },
    context: async ({ req }) => {
        // const email = req.headers["x-user-email"] as string;
        const email = "testuser1.fastchargeapi@gmail.com";
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
        });
    },
});

console.log("Server ready at: " + url);
