import { BaseContext } from "@apollo/server";
import { Batched } from "./database/dataloader";
import {
    AccountActivity,
    AccountActivityModel,
    AccountActivityRequiredCreateProps,
    AccountHistory,
    AccountHistoryModel,
    AccountHistoryRequiredCreateProps,
    App,
    AppModel,
    AppRequiredCreateProps,
    AppTag,
    AppTagModel,
    AppTagRequiredCreateProps,
    Endpoint,
    EndpointModel,
    EndpointRequiredCreateProps,
    FreeQuotaUsage,
    FreeQuotaUsageModel,
    FreeQuotaUsageRequiredCreateProps,
    GatewayRequestCounter,
    GatewayRequestCounterModel,
    GatewayRequestCounterRequiredCreateProps,
    GatewayRequestDecisionCache,
    GatewayRequestDecisionCacheModel,
    GatewayRequestDecisionCacheRequiredCreateProps,
    Pricing,
    PricingModel,
    PricingRequiredCreateProps,
    Secret,
    SecretModel,
    SecretRequiredCreateProps,
    SiteMetaData,
    SiteMetaDataModel,
    SiteMetaDataRequiredCreateProps,
    StripePaymentAccept,
    StripePaymentAcceptModel,
    StripePaymentAcceptRequiredCreateProps,
    StripeTransfer,
    StripeTransferModel,
    StripeTransferRequiredCreateProps,
    Subscription,
    SubscriptionModel,
    SubscriptionRequiredCreateProps,
    UsageLog,
    UsageLogModel,
    UsageLogRequiredCreateProps,
    UsageSummary,
    UsageSummaryModel,
    UsageSummaryRequiredCreateProps,
    User,
    UserAppToken,
    UserAppTokenModel,
    UserAppTokenRequiredCreateProps,
    UserModel,
    UserRequiredCreateProps,
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
        User: new Batched<User, UserRequiredCreateProps>(UserModel),
        App: new Batched<App, AppRequiredCreateProps>(AppModel),
        AppTag: new Batched<AppTag, AppTagRequiredCreateProps>(AppTagModel),
        Endpoint: new Batched<Endpoint, EndpointRequiredCreateProps>(EndpointModel),
        Pricing: new Batched<Pricing, PricingRequiredCreateProps>(PricingModel),
        Subscription: new Batched<Subscription, SubscriptionRequiredCreateProps>(SubscriptionModel),
        UsageLog: new Batched<UsageLog, UsageLogRequiredCreateProps>(UsageLogModel),
        UsageSummary: new Batched<UsageSummary, UsageSummaryRequiredCreateProps>(UsageSummaryModel),
        StripePaymentAccept: new Batched<StripePaymentAccept, StripePaymentAcceptRequiredCreateProps>(
            StripePaymentAcceptModel
        ),
        AccountActivity: new Batched<AccountActivity, AccountActivityRequiredCreateProps>(AccountActivityModel),
        AccountHistory: new Batched<AccountHistory, AccountHistoryRequiredCreateProps>(AccountHistoryModel),
        Secret: new Batched<Secret, SecretRequiredCreateProps>(SecretModel),
        StripeTransfer: new Batched<StripeTransfer, StripeTransferRequiredCreateProps>(StripeTransferModel),
        GatewayRequestCounter: new Batched<GatewayRequestCounter, GatewayRequestCounterRequiredCreateProps>(
            GatewayRequestCounterModel
        ),
        GatewayRequestDecisionCache: new Batched<
            GatewayRequestDecisionCache,
            GatewayRequestDecisionCacheRequiredCreateProps
        >(GatewayRequestDecisionCacheModel),
        UserAppToken: new Batched<UserAppToken, UserAppTokenRequiredCreateProps>(UserAppTokenModel),
        FreeQuotaUsage: new Batched<FreeQuotaUsage, FreeQuotaUsageRequiredCreateProps>(FreeQuotaUsageModel),
        SiteMetaData: new Batched<SiteMetaData, SiteMetaDataRequiredCreateProps>(SiteMetaDataModel),
    };
}

export type DefaultContextBatched = ReturnType<typeof createDefaultContextBatched>;
