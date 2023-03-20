export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: string;
    String: string;
    Boolean: boolean;
    Int: number;
    Float: number;
    Email: any;
    NonNegativeDecimal: any;
    Timestamp: number;
};

export type GQLAccountActivity = {
    __typename?: "AccountActivity";
    amount: Scalars["String"];
    billedApp?: Maybe<GQLApp>;
    createdAt: Scalars["Timestamp"];
    description: Scalars["String"];
    pk: Scalars["ID"];
    reason: GQLAccountActivityReason;
    settleAt: Scalars["Timestamp"];
    status?: Maybe<GQLAccountActivityStatus>;
    stripeTransfer?: Maybe<GQLStripeTransfer>;
    type: GQLAccountActivityType;
    usageSummary?: Maybe<GQLUsageSummary>;
};

export enum GQLAccountActivityIndex {
    IndexByStatusSettleAtOnlyPk = "indexByStatus_settleAt__onlyPK",
}

export enum GQLAccountActivityReason {
    ApiMinMonthlyCharge = "api_min_monthly_charge",
    ApiMinMonthlyChargeUpgrade = "api_min_monthly_charge_upgrade",
    ApiPerRequestCharge = "api_per_request_charge",
    FastchargeapiPerRequestServiceFee = "fastchargeapi_per_request_service_fee",
    Payout = "payout",
    PayoutFee = "payout_fee",
    Topup = "topup",
}

export enum GQLAccountActivityStatus {
    Pending = "pending",
    Settled = "settled",
}

export enum GQLAccountActivityType {
    Credit = "credit",
    Debit = "debit",
}

export type GQLAccountHistory = {
    __typename?: "AccountHistory";
    closingBalance: Scalars["String"];
    closingTime: Scalars["Timestamp"];
};

export type GQLApp = {
    __typename?: "App";
    deleteApp: GQLApp;
    description?: Maybe<Scalars["String"]>;
    endpoints: Array<GQLEndpoint>;
    gatewayMode: GQLGatewayMode;
    homepage?: Maybe<Scalars["String"]>;
    name: Scalars["String"];
    owner: GQLUser;
    pricingPlans: Array<GQLPricing>;
    repository?: Maybe<Scalars["String"]>;
    title?: Maybe<Scalars["String"]>;
    updateApp: GQLApp;
};

export type GQLAppUpdateAppArgs = {
    description?: InputMaybe<Scalars["String"]>;
    homepage?: InputMaybe<Scalars["String"]>;
    repository?: InputMaybe<Scalars["String"]>;
    title?: InputMaybe<Scalars["String"]>;
};

export enum GQLAppIndex {
    IndexByOwnerOnlyPk = "indexByOwner__onlyPK",
}

export type GQLDateRangeInput = {
    end?: InputMaybe<Scalars["Timestamp"]>;
    start?: InputMaybe<Scalars["Timestamp"]>;
};

export type GQLEndpoint = {
    __typename?: "Endpoint";
    createdAt: Scalars["Timestamp"];
    deleteEndpoint: GQLEndpoint;
    description?: Maybe<Scalars["String"]>;
    destination?: Maybe<Scalars["String"]>;
    method: GQLHttpMethod;
    path: Scalars["String"];
    pk: Scalars["String"];
    updateEndpoint: GQLEndpoint;
    updatedAt: Scalars["Timestamp"];
};

export type GQLEndpointUpdateEndpointArgs = {
    description?: InputMaybe<Scalars["String"]>;
    destination?: InputMaybe<Scalars["String"]>;
    method?: InputMaybe<GQLHttpMethod>;
    path?: InputMaybe<Scalars["String"]>;
};

export type GQLGatewayDecisionResponse = {
    __typename?: "GatewayDecisionResponse";
    allowed: Scalars["Boolean"];
    pricingPK?: Maybe<Scalars["String"]>;
    reason?: Maybe<GQLGatewayDecisionResponseReason>;
    userPK?: Maybe<Scalars["String"]>;
};

export enum GQLGatewayDecisionResponseReason {
    InsufficientBalance = "insufficient_balance",
    NotSubscribed = "not_subscribed",
    OwnerInsufficientBalance = "owner_insufficient_balance",
    TooManyRequests = "too_many_requests",
}

export enum GQLGatewayMode {
    Proxy = "proxy",
    Redirect = "redirect",
}

export enum GQLHttpMethod {
    Any = "ANY",
    Delete = "DELETE",
    Get = "GET",
    Head = "HEAD",
    Options = "OPTIONS",
    Patch = "PATCH",
    Post = "POST",
    Put = "PUT",
}

export type GQLMutation = {
    __typename?: "Mutation";
    createApp: GQLApp;
    createEndpoint: GQLEndpoint;
    createPricing: GQLPricing;
    createSecret: GQLSecret;
    createStripeTransfer: GQLStripeTransfer;
    createSubscription: GQLSubscribe;
    createUsageLog: GQLUsageLog;
    triggerBilling: Array<GQLUsageSummary>;
};

export type GQLMutationCreateAppArgs = {
    description?: InputMaybe<Scalars["String"]>;
    gatewayMode?: InputMaybe<GQLGatewayMode>;
    homepage?: InputMaybe<Scalars["String"]>;
    name: Scalars["String"];
    owner: Scalars["ID"];
    repository?: InputMaybe<Scalars["String"]>;
    title?: InputMaybe<Scalars["String"]>;
};

export type GQLMutationCreateEndpointArgs = {
    app: Scalars["String"];
    description?: InputMaybe<Scalars["String"]>;
    destination: Scalars["String"];
    method: GQLHttpMethod;
    path: Scalars["String"];
};

export type GQLMutationCreatePricingArgs = {
    app: Scalars["String"];
    callToAction: Scalars["String"];
    chargePerRequest: Scalars["String"];
    minMonthlyCharge: Scalars["String"];
    name: Scalars["String"];
};

export type GQLMutationCreateSecretArgs = {
    description?: InputMaybe<Scalars["String"]>;
    expireAt?: InputMaybe<Scalars["Timestamp"]>;
    key: Scalars["String"];
    value: Scalars["String"];
};

export type GQLMutationCreateStripeTransferArgs = {
    currency: Scalars["String"];
    receiveAmount: Scalars["NonNegativeDecimal"];
    receiver: Scalars["ID"];
    stripeTransferId?: InputMaybe<Scalars["String"]>;
    stripeTransferObject?: InputMaybe<Scalars["String"]>;
    withdrawAmount: Scalars["NonNegativeDecimal"];
};

export type GQLMutationCreateSubscriptionArgs = {
    app: Scalars["ID"];
    pricing: Scalars["ID"];
    subscriber: Scalars["ID"];
};

export type GQLMutationCreateUsageLogArgs = {
    app: Scalars["ID"];
    path: Scalars["String"];
    pricing: Scalars["ID"];
    subscriber: Scalars["ID"];
    volume?: Scalars["Int"];
};

export type GQLMutationTriggerBillingArgs = {
    app: Scalars["ID"];
    user: Scalars["ID"];
};

export type GQLPricing = {
    __typename?: "Pricing";
    app: GQLApp;
    callToAction: Scalars["String"];
    chargePerRequest: Scalars["String"];
    deletePricing: GQLPricing;
    freeQuota: Scalars["Int"];
    minMonthlyCharge: Scalars["String"];
    mutable: Scalars["Boolean"];
    name: Scalars["String"];
    pk: Scalars["ID"];
    updatePricing: GQLPricing;
    visible: Scalars["Boolean"];
};

export type GQLPricingUpdatePricingArgs = {
    callToAction?: InputMaybe<Scalars["String"]>;
    chargePerRequest?: InputMaybe<Scalars["String"]>;
    freeQuota?: InputMaybe<Scalars["Int"]>;
    minMonthlyCharge?: InputMaybe<Scalars["String"]>;
    name?: InputMaybe<Scalars["String"]>;
    visible?: InputMaybe<Scalars["Boolean"]>;
};

export type GQLQuery = {
    __typename?: "Query";
    app: GQLApp;
    appFullTextSearch: Array<GQLApp>;
    checkUserIsAllowedForGatewayRequest: GQLGatewayDecisionResponse;
    endpoint: GQLEndpoint;
    endpoints?: Maybe<Array<Maybe<GQLEndpoint>>>;
    secret: GQLSecret;
    subscription: GQLSubscribe;
    user: GQLUser;
};

export type GQLQueryAppArgs = {
    name?: InputMaybe<Scalars["String"]>;
};

export type GQLQueryAppFullTextSearchArgs = {
    query: Scalars["String"];
};

export type GQLQueryCheckUserIsAllowedForGatewayRequestArgs = {
    app: Scalars["ID"];
    forceAwait?: InputMaybe<Scalars["Boolean"]>;
    forceBalanceCheck?: InputMaybe<Scalars["Boolean"]>;
    userEmail: Scalars["Email"];
};

export type GQLQueryEndpointArgs = {
    app?: InputMaybe<Scalars["String"]>;
    path?: InputMaybe<Scalars["String"]>;
    pk?: InputMaybe<Scalars["ID"]>;
};

export type GQLQuerySecretArgs = {
    key: Scalars["String"];
};

export type GQLQuerySubscriptionArgs = {
    app?: InputMaybe<Scalars["String"]>;
    pk?: InputMaybe<Scalars["ID"]>;
    subscriber?: InputMaybe<Scalars["ID"]>;
};

export type GQLQueryUserArgs = {
    email?: InputMaybe<Scalars["Email"]>;
    pk?: InputMaybe<Scalars["ID"]>;
};

export type GQLSecret = {
    __typename?: "Secret";
    createdAt: Scalars["Timestamp"];
    deleteSecret?: Maybe<GQLSecret>;
    expireAt?: Maybe<Scalars["Timestamp"]>;
    key: Scalars["String"];
    value: Scalars["String"];
};

export enum GQLSortDirection {
    Ascending = "ascending",
    Descending = "descending",
}

export type GQLStripePaymentAccept = {
    __typename?: "StripePaymentAccept";
    amount: Scalars["NonNegativeDecimal"];
    createdAt: Scalars["Timestamp"];
    currency: Scalars["String"];
    settlePayment: GQLStripePaymentAccept;
    status: GQLStripePaymentAcceptStatus;
    stripePaymentIntent: Scalars["String"];
    stripePaymentStatus: Scalars["String"];
    stripeSessionId: Scalars["String"];
    stripeSessionObject: Scalars["String"];
    user: GQLUser;
};

export type GQLStripePaymentAcceptSettlePaymentArgs = {
    stripeSessionObject: Scalars["String"];
};

export enum GQLStripePaymentAcceptStatus {
    Pending = "pending",
    Settled = "settled",
}

export type GQLStripeTransfer = {
    __typename?: "StripeTransfer";
    createdAt: Scalars["Timestamp"];
    currency?: Maybe<Scalars["String"]>;
    receiveAmount: Scalars["NonNegativeDecimal"];
    receiver: GQLUser;
    settleStripeTransfer: GQLStripeTransfer;
    status?: Maybe<GQLStripeTransferStatus>;
    stripeTransferId?: Maybe<Scalars["String"]>;
    stripeTransferObject?: Maybe<Scalars["String"]>;
    transferAt: Scalars["Timestamp"];
    withdrawAmount: Scalars["NonNegativeDecimal"];
};

export enum GQLStripeTransferIndex {
    IndexByStatusTransferAtOnlyPk = "indexByStatus_transferAt__onlyPK",
}

export enum GQLStripeTransferStatus {
    Failed = "failed",
    Pending = "pending",
    Transferred = "transferred",
}

export type GQLSubscribe = {
    __typename?: "Subscribe";
    app: GQLApp;
    createdAt: Scalars["Timestamp"];
    deleteSubscription?: Maybe<GQLSubscribe>;
    pk: Scalars["String"];
    pricing: GQLPricing;
    subscriber: GQLUser;
    updateSubscription?: Maybe<GQLSubscribe>;
    updatedAt: Scalars["Timestamp"];
};

export type GQLSubscribeUpdateSubscriptionArgs = {
    pricing?: InputMaybe<Scalars["ID"]>;
};

export type GQLUsageLog = {
    __typename?: "UsageLog";
    app: GQLApp;
    collectedAt: Scalars["Timestamp"];
    createdAt: Scalars["Timestamp"];
    endpoint: GQLEndpoint;
    status: Scalars["String"];
    subscriber: GQLUser;
    volume: Scalars["Int"];
};

export type GQLUsageSummary = {
    __typename?: "UsageSummary";
    app: GQLApp;
    billed: Scalars["Boolean"];
    billedAt?: Maybe<Scalars["Timestamp"]>;
    billingAccountActivity?: Maybe<GQLAccountActivity>;
    createdAt: Scalars["Timestamp"];
    subscriber: GQLUser;
    volume: Scalars["Int"];
};

export type GQLUser = {
    __typename?: "User";
    accountActivities: Array<GQLAccountActivity>;
    accountHistories: Array<GQLAccountHistory>;
    appToken: GQLUserAppToken;
    apps: Array<GQLApp>;
    author: Scalars["String"];
    balance: Scalars["String"];
    balanceLimit: Scalars["String"];
    createAppToken: GQLUserAppToken;
    createdAt: Scalars["Timestamp"];
    email: Scalars["Email"];
    pk: Scalars["ID"];
    settleAccountActivities: Array<GQLAccountActivity>;
    stripeConnectAccountId?: Maybe<Scalars["String"]>;
    stripeCustomerId?: Maybe<Scalars["String"]>;
    stripePaymentAccept: GQLStripePaymentAccept;
    subscriptions: Array<GQLSubscribe>;
    updateUser?: Maybe<GQLUser>;
    updatedAt: Scalars["Timestamp"];
    usageLogs: Array<GQLUsageLog>;
    usageSummaries: Array<GQLUsageSummary>;
};

export type GQLUserAccountActivitiesArgs = {
    dateRange?: InputMaybe<GQLDateRangeInput>;
    limit?: InputMaybe<Scalars["Int"]>;
};

export type GQLUserAccountHistoriesArgs = {
    dateRange?: InputMaybe<GQLDateRangeInput>;
    limit?: InputMaybe<Scalars["Int"]>;
};

export type GQLUserAppTokenArgs = {
    app: Scalars["ID"];
};

export type GQLUserCreateAppTokenArgs = {
    app: Scalars["ID"];
};

export type GQLUserStripePaymentAcceptArgs = {
    stripeSessionId?: InputMaybe<Scalars["String"]>;
};

export type GQLUserUpdateUserArgs = {
    author?: InputMaybe<Scalars["String"]>;
    stripeConnectAccountId?: InputMaybe<Scalars["String"]>;
    stripeCustomerId?: InputMaybe<Scalars["String"]>;
};

export type GQLUserUsageLogsArgs = {
    app?: InputMaybe<Scalars["String"]>;
    dateRange?: InputMaybe<GQLDateRangeInput>;
    limit?: InputMaybe<Scalars["Int"]>;
    path?: InputMaybe<Scalars["String"]>;
};

export type GQLUserUsageSummariesArgs = {
    app: Scalars["ID"];
    dateRange?: InputMaybe<GQLDateRangeInput>;
    limit?: InputMaybe<Scalars["Int"]>;
};

export type GQLUserAppToken = {
    __typename?: "UserAppToken";
    app: GQLApp;
    createdAt: Scalars["Timestamp"];
    deleteUserAppToken: GQLUserAppToken;
    signature: Scalars["String"];
    subscriber: GQLUser;
    token?: Maybe<Scalars["String"]>;
    updatedAt: Scalars["Timestamp"];
};

export enum GQLUserIndex {
    IndexByEmailOnlyPk = "indexByEmail__onlyPK",
}

export type GQLFulfillUserStripePaymentAcceptQueryVariables = Exact<{
    user: Scalars["ID"];
    stripeSessionId: Scalars["String"];
    stripeSessionObject: Scalars["String"];
}>;

export type GQLFulfillUserStripePaymentAcceptQuery = {
    __typename?: "Query";
    user: {
        __typename?: "User";
        stripePaymentAccept: {
            __typename?: "StripePaymentAccept";
            settlePayment: { __typename?: "StripePaymentAccept"; stripePaymentStatus: string };
        };
    };
};

export type GQLCreateStripeTransferMutationVariables = Exact<{
    userPK: Scalars["ID"];
    withdrawAmount: Scalars["NonNegativeDecimal"];
    receiveAmount: Scalars["NonNegativeDecimal"];
}>;

export type GQLCreateStripeTransferMutation = {
    __typename?: "Mutation";
    createStripeTransfer: {
        __typename?: "StripeTransfer";
        settleStripeTransfer: { __typename?: "StripeTransfer"; createdAt: number };
    };
};
