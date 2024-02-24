import { Batched } from "@/src/database/dataloader";
import {
  AccountActivity,
  AccountActivityCreateProps,
  AccountActivityModel,
} from "@/src/database/models/AccountActivity";
import { AccountHistory, AccountHistoryCreateProps, AccountHistoryModel } from "@/src/database/models/AccountHistory";
import { App, AppCreateProps, AppModel } from "@/src/database/models/App";
import { AppTag, AppTagCreateProps, AppTagModel } from "@/src/database/models/AppTag";
import { Endpoint, EndpointCreateProps, EndpointModel } from "@/src/database/models/Endpoint";
import { FreeQuotaUsage, FreeQuotaUsageCreateProps, FreeQuotaUsageModel } from "@/src/database/models/FreeQuotaUsage";
import {
  GatewayRequestCounter,
  GatewayRequestCounterCreateProps,
  GatewayRequestCounterModel,
} from "@/src/database/models/GatewayRequestCounter";
import {
  GatewayRequestDecisionCache,
  GatewayRequestDecisionCacheCreateProps,
  GatewayRequestDecisionCacheModel,
} from "@/src/database/models/GatewayRequestDecisionCache";
import { Pricing, PricingCreateProps, PricingModel } from "@/src/database/models/Pricing";
import { Secret, SecretCreateProps, SecretModel } from "@/src/database/models/Secret";
import { SiteMetaData, SiteMetaDataCreateProps, SiteMetaDataModel } from "@/src/database/models/SiteMetaData";
import {
  StripePaymentAccept,
  StripePaymentAcceptCreateProps,
  StripePaymentAcceptModel,
} from "@/src/database/models/StripePaymentAccept";
import { StripeTransfer, StripeTransferCreateProps, StripeTransferModel } from "@/src/database/models/StripeTransfer";
import { Subscription, SubscriptionCreateProps, SubscriptionModel } from "@/src/database/models/Subscription";
import { UsageLog, UsageLogCreateProps, UsageLogModel } from "@/src/database/models/UsageLog";
import { UsageSummary, UsageSummaryCreateProps, UsageSummaryModel } from "@/src/database/models/UsageSummary";
import { User, UserCreateProps, UserModel } from "@/src/database/models/User";
import { UserAppToken, UserAppTokenCreateProps, UserAppTokenModel } from "@/src/database/models/UserAppToken";
import { SQSQueueName } from "@/src/sqsClient";
import { BaseContext } from "@apollo/server";

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
  sqsQueueName?: SQSQueueName;
  sqsMessageDeduplicationId?: string;
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
