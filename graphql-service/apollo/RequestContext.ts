import { BaseContext } from "@apollo/server";
import { Batched } from "./dynamoose/dataloader";
import {
    AccountActivityModel,
    AccountHistoryModel,
    AppModel,
    EndpointModel,
    FreeQuotaUsageModel,
    GatewayRequestCounterModel,
    GatewayRequestDecisionCacheModel,
    PricingModel,
    SecretModel,
    StripePaymentAcceptModel,
    StripeTransferModel,
    SubscriptionModel,
    UsageLogModel,
    UsageSummaryModel,
    User,
    UserAppTokenModel,
    UserModel,
} from "./dynamoose/models";

export type RequestService = "payment" | "gateway" | "internal";
export interface RequestContext extends BaseContext {
    currentUser?: User;
    isAdminUser?: boolean;
    isAnonymousUser?: boolean;
    service?: RequestService;
    isServiceRequest: boolean;
    batched: ReturnType<typeof createDefaultContextBatched>;
    isSQSMessage: boolean;
    sqsMessageGroupId?: string;
    sqsQueueName?: string;
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
        UserAppToken: new Batched(UserAppTokenModel),
        FreeQuotaUsage: new Batched(FreeQuotaUsageModel),
    };
}

export type DefaultContextBatched = ReturnType<typeof createDefaultContextBatched>;
