import { BaseContext } from "@apollo/server";
import { Batched } from "./dynamoose/dataloader";
import {
    UserModel,
    AppModel,
    EndpointModel,
    PricingModel,
    SubscriptionModel,
    UsageLogModel,
    UsageSummaryModel,
    StripePaymentAcceptModel,
    AccountActivityModel,
    AccountHistoryModel,
    SecretModel,
    StripeTransferModel,
    GatewayRequestCounterModel,
    GatewayRequestDecisionCacheModel,
} from "./dynamoose/models";

export type RequestService = "payment" | "gateway" | "internal";
export interface RequestContext extends BaseContext {
    currentUser?: string;
    service?: RequestService;
    isServiceRequest: boolean;
    batched: ReturnType<typeof createDefaultContextBatched>;
    isSQSMessage: boolean;
}

// Add more models here when new models are created
export function createDefaultContextBatched() {
    return {
        User: new Batched(UserModel),
        App: new Batched(AppModel),
        Endpoint: new Batched(EndpointModel),
        Pricing: new Batched(PricingModel),
        Subscription: new Batched(SubscriptionModel),
        UsageLog: new Batched(UsageLogModel),
        UsageSummary: new Batched(UsageSummaryModel),
        StripePaymentAccept: new Batched(StripePaymentAcceptModel),
        AccountActivity: new Batched(AccountActivityModel),
        AccountHistory: new Batched(AccountHistoryModel),
        Secret: new Batched(SecretModel),
        StripeTransfer: new Batched(StripeTransferModel),
        GatewayRequestCounter: new Batched(GatewayRequestCounterModel),
        GatewayRequestDecisionCache: new Batched(GatewayRequestDecisionCacheModel),
    };
}
