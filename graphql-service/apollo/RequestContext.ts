import { BaseContext } from "@apollo/server";
import { Batched } from "./database/dataloader";
import {
    AccountActivity,
    AccountActivityCreateProps,
    AccountActivityModel,
    AccountHistory,
    AccountHistoryCreateProps,
    AccountHistoryModel,
    App,
    AppCreateProps,
    AppModel,
    AppTag,
    AppTagCreateProps,
    AppTagModel,
    Endpoint,
    EndpointCreateProps,
    EndpointModel,
    FreeQuotaUsage,
    FreeQuotaUsageCreateProps,
    FreeQuotaUsageModel,
    GatewayRequestCounter,
    GatewayRequestCounterCreateProps,
    GatewayRequestCounterModel,
    GatewayRequestDecisionCache,
    GatewayRequestDecisionCacheCreateProps,
    GatewayRequestDecisionCacheModel,
    Pricing,
    PricingCreateProps,
    PricingModel,
    Secret,
    SecretCreateProps,
    SecretModel,
    SiteMetaData,
    SiteMetaDataCreateProps,
    SiteMetaDataModel,
    StripePaymentAccept,
    StripePaymentAcceptCreateProps,
    StripePaymentAcceptModel,
    StripeTransfer,
    StripeTransferCreateProps,
    StripeTransferModel,
    Subscription,
    SubscriptionCreateProps,
    SubscriptionModel,
    UsageLog,
    UsageLogCreateProps,
    UsageLogModel,
    UsageSummary,
    UsageSummaryCreateProps,
    UsageSummaryModel,
    User,
    UserAppToken,
    UserAppTokenCreateProps,
    UserAppTokenModel,
    UserCreateProps,
    UserModel,
} from "./database/models";

export type RequestService = "payment" | "gateway" | "internal";
export interface RequestContext extends BaseContext {
    currentUser?: User;
    isAdminUser: boolean;
    isAnonymousUser: boolean;
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
        User: new Batched<User, UserCreateProps>(UserModel),
        App: new Batched<App, AppCreateProps>(AppModel),
        AppTag: new Batched<AppTag, AppTagCreateProps>(AppTagModel),
        Endpoint: new Batched<Endpoint, EndpointCreateProps>(EndpointModel),
        Pricing: new Batched<Pricing, PricingCreateProps>(PricingModel),
        Subscription: new Batched<Subscription, SubscriptionCreateProps>(SubscriptionModel),
        UsageLog: new Batched<UsageLog, UsageLogCreateProps>(UsageLogModel),
        UsageSummary: new Batched<UsageSummary, UsageSummaryCreateProps>(UsageSummaryModel),
        StripePaymentAccept: new Batched<StripePaymentAccept, StripePaymentAcceptCreateProps>(StripePaymentAcceptModel),
        AccountActivity: new Batched<AccountActivity, AccountActivityCreateProps>(AccountActivityModel),
        AccountHistory: new Batched<AccountHistory, AccountHistoryCreateProps>(AccountHistoryModel),
        Secret: new Batched<Secret, SecretCreateProps>(SecretModel),
        StripeTransfer: new Batched<StripeTransfer, StripeTransferCreateProps>(StripeTransferModel),
        GatewayRequestCounter: new Batched<GatewayRequestCounter, GatewayRequestCounterCreateProps>(
            GatewayRequestCounterModel
        ),
        GatewayRequestDecisionCache: new Batched<GatewayRequestDecisionCache, GatewayRequestDecisionCacheCreateProps>(
            GatewayRequestDecisionCacheModel
        ),
        UserAppToken: new Batched<UserAppToken, UserAppTokenCreateProps>(UserAppTokenModel),
        FreeQuotaUsage: new Batched<FreeQuotaUsage, FreeQuotaUsageCreateProps>(FreeQuotaUsageModel),
        SiteMetaData: new Batched<SiteMetaData, SiteMetaDataCreateProps>(SiteMetaDataModel),
    };
}

export type DefaultContextBatched = ReturnType<typeof createDefaultContextBatched>;
