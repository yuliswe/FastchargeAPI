import { BaseContext } from "@apollo/server";
import { Batched } from "./dynamoose/dataloader";
import {
    UserModel,
    AppModel,
    EndpointModel,
    PricingModel,
    SubscribeModel,
    UsageLogModel,
    UsageSummaryModel,
    StripePaymentAcceptModel,
    AccountActivityModel,
    AccountHistoryModel,
} from "./dynamoose/models";

export type RequestService = "payment" | "gateway" | "internal";
export interface RequestContext extends BaseContext {
    currentUser?: string;
    service?: RequestService;
    isServiceRequest: boolean;
    batched: ReturnType<typeof createDefaultContextBatched>;
}

// Add more models here when new models are created
export function createDefaultContextBatched() {
    return {
        User: new Batched(UserModel),
        App: new Batched(AppModel),
        Endpoint: new Batched(EndpointModel),
        Pricing: new Batched(PricingModel),
        Subscribe: new Batched(SubscribeModel),
        UsageLog: new Batched(UsageLogModel),
        UsageSummary: new Batched(UsageSummaryModel),
        StripePaymentAccept: new Batched(StripePaymentAcceptModel),
        AccountActivity: new Batched(AccountActivityModel),
        AccountHistory: new Batched(AccountHistoryModel),
    };
}
