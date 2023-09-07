import { startStandaloneServer } from "@apollo/server/standalone";
import chalk from "chalk";
import { IncomingMessage } from "http";
import { RequestContext, createDefaultContextBatched } from "./RequestContext";
import { setUpTraceConsole } from "./console";
import {
    getCurrentUser,
    getIsAdminUser,
    getIsServiceRequest,
    normalizeHeaders,
    printWarnings,
} from "./lambdaHandlerUtils";
import { server } from "./server";

if (process.env.TRACE_CONSOLE === "1") {
    setUpTraceConsole();
}

void startStandaloneServer<RequestContext>(server, {
    listen: {
        port: process.env.PORT ? Number.parseInt(process.env.PORT) : 4000,
    },
    context: async ({ req }: { req: IncomingMessage }) => {
        printWarnings();
        const batched = createDefaultContextBatched();
        const headers: { [header: string]: string } = normalizeHeaders(req.headers as any);
        const currentUser = await getCurrentUser(batched, headers, undefined);
        const isAdminUser = getIsAdminUser(currentUser, undefined);
        const { serviceName, isServiceRequest } = getIsServiceRequest("", headers);
        return Promise.resolve({
            currentUser,
            service: serviceName,
            batched,
            isServiceRequest,
            isSQSMessage: false,
            isAnonymousUser: currentUser == undefined,
            isAdminUser,
        });
    },
}).then(({ url }) => {
    console.log(chalk.green(`Server ready at: ${url}`));
});
