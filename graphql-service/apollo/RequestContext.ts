import { BaseContext } from "@apollo/server";
import { createDefaultContextBatched } from "./server";

export type RequestService = "payment" | "gateway" | "internal";
export interface RequestContext extends BaseContext {
    currentUser?: string;
    service?: RequestService;
    isServiceRequest: boolean;
    batched: ReturnType<typeof createDefaultContextBatched>;
}
