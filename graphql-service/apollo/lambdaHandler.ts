import {
    startServerAndCreateLambdaHandler,
    handlers,
} from "@as-integrations/aws-lambda";
import { createDefaultContextBatched, RequestContext, server } from "./server";

export const lambdaHandler = startServerAndCreateLambdaHandler<
    any,
    RequestContext
>(server, handlers.createAPIGatewayProxyEventRequestHandler(), {
    context: () => {
        return Promise.resolve({
            currentUser: "",
            batched: createDefaultContextBatched(),
        });
    },
});
