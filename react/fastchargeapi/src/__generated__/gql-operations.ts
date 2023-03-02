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
  __typename?: 'AccountActivity';
  amount: Scalars['String'];
  createdAt: Scalars['Timestamp'];
  description: Scalars['String'];
  reason: GQLAccountActivityReason;
  type: GQLAccountActivityType;
};

export enum GQLAccountActivityReason {
  ApiMinMonthlyCharge = 'api_min_monthly_charge',
  ApiPerRequestCharge = 'api_per_request_charge',
  Payout = 'payout',
  Topup = 'topup'
}

export enum GQLAccountActivityType {
  Credit = 'credit',
  Debit = 'debit'
}

export type GQLAccountHistory = {
  __typename?: 'AccountHistory';
  closingBalance: Scalars['String'];
  closingTime: Scalars['Timestamp'];
};

export type GQLApp = {
  __typename?: 'App';
  createAppUserToken: Scalars['String'];
  deleteApp: GQLApp;
  description: Scalars['String'];
  endpoints: Array<GQLEndpoint>;
  gatewayMode: GQLGatewayMode;
  name: Scalars['String'];
  ownedByYou: Scalars['Boolean'];
  owner: GQLUser;
  pricingPlans: Array<GQLPricing>;
  revokeAppUserToken: Scalars['Boolean'];
  updateApp: GQLApp;
};


export type GQLAppUpdateAppArgs = {
  description?: InputMaybe<Scalars['String']>;
  gatewayMode?: InputMaybe<GQLGatewayMode>;
};

export type GQLDateRangeInput = {
  end?: InputMaybe<Scalars['Timestamp']>;
  start?: InputMaybe<Scalars['Timestamp']>;
};

export type GQLEndpoint = {
  __typename?: 'Endpoint';
  deleteEndpoint?: Maybe<GQLEndpoint>;
  description?: Maybe<Scalars['String']>;
  destination?: Maybe<Scalars['String']>;
  path: Scalars['String'];
  ref: Scalars['String'];
  updateEndpoint?: Maybe<GQLEndpoint>;
};


export type GQLEndpointUpdateEndpointArgs = {
  description?: InputMaybe<Scalars['String']>;
  destination?: InputMaybe<Scalars['String']>;
  path?: InputMaybe<Scalars['String']>;
};

export enum GQLGatewayMode {
  Proxy = 'proxy',
  Redirect = 'redirect'
}

export type GQLMutation = {
  __typename?: 'Mutation';
  createApp: GQLApp;
  createEndpoint: GQLEndpoint;
  createPricing: GQLPricing;
  createSecret: GQLSecret;
  createStripePaymentAccept: GQLStripePaymentAccept;
  createStripeTransfer: GQLStripeTransfer;
  createSubscription: GQLSubscribe;
  createUsageLog: GQLUsageLog;
  createUser: GQLUser;
  triggerBilling?: Maybe<GQLUsageSummary>;
};


export type GQLMutationCreateAppArgs = {
  description?: InputMaybe<Scalars['String']>;
  gatewayMode?: InputMaybe<GQLGatewayMode>;
  name: Scalars['String'];
  owner: Scalars['String'];
};


export type GQLMutationCreateEndpointArgs = {
  app: Scalars['String'];
  description?: InputMaybe<Scalars['String']>;
  destination: Scalars['String'];
  path: Scalars['String'];
};


export type GQLMutationCreatePricingArgs = {
  app: Scalars['String'];
  callToAction: Scalars['String'];
  chargePerRequest: Scalars['String'];
  minMonthlyCharge: Scalars['String'];
  name: Scalars['String'];
};


export type GQLMutationCreateSecretArgs = {
  description?: InputMaybe<Scalars['String']>;
  expireAt?: InputMaybe<Scalars['Timestamp']>;
  key: Scalars['String'];
  value: Scalars['String'];
};


export type GQLMutationCreateStripePaymentAcceptArgs = {
  amountCents: Scalars['Int'];
  currency: Scalars['String'];
  stripePaymentIntent: Scalars['String'];
  stripePaymentStatus: Scalars['String'];
  stripeSessionId: Scalars['String'];
  stripeSessionObject: Scalars['String'];
  user: Scalars['String'];
};


export type GQLMutationCreateStripeTransferArgs = {
  currency: Scalars['String'];
  receiveCents: Scalars['Int'];
  receiver: Scalars['Email'];
  stripeTransferId: Scalars['String'];
  stripeTransferObject: Scalars['String'];
  withdrawCents: Scalars['Int'];
};


export type GQLMutationCreateSubscriptionArgs = {
  app: Scalars['String'];
  pricing: Scalars['ID'];
  subscriber: Scalars['Email'];
};


export type GQLMutationCreateUsageLogArgs = {
  app: Scalars['String'];
  path: Scalars['String'];
  subscriber: Scalars['Email'];
  volume?: Scalars['Int'];
};


export type GQLMutationCreateUserArgs = {
  email: Scalars['Email'];
};


export type GQLMutationTriggerBillingArgs = {
  app: Scalars['ID'];
  user: Scalars['ID'];
};

export type GQLPricing = {
  __typename?: 'Pricing';
  app: GQLApp;
  callToAction: Scalars['String'];
  chargePerRequest: Scalars['String'];
  deletePricing?: Maybe<GQLPricing>;
  freeQuota: Scalars['Int'];
  minMonthlyCharge: Scalars['String'];
  name: Scalars['String'];
  pk: Scalars['ID'];
};

export type GQLQuery = {
  __typename?: 'Query';
  app: GQLApp;
  apps?: Maybe<Array<Maybe<GQLApp>>>;
  endpoint: GQLEndpoint;
  endpoints?: Maybe<Array<Maybe<GQLEndpoint>>>;
  secret: GQLSecret;
  stripePaymentAccept: GQLStripePaymentAccept;
  subscription: GQLSubscribe;
  user: GQLUser;
  users?: Maybe<Array<Maybe<GQLUser>>>;
};


export type GQLQueryAppArgs = {
  name?: InputMaybe<Scalars['String']>;
};


export type GQLQueryEndpointArgs = {
  app?: InputMaybe<Scalars['String']>;
  path?: InputMaybe<Scalars['String']>;
  ref?: InputMaybe<Scalars['ID']>;
};


export type GQLQuerySecretArgs = {
  key: Scalars['String'];
};


export type GQLQueryStripePaymentAcceptArgs = {
  stripeSessionId: Scalars['String'];
};


export type GQLQuerySubscriptionArgs = {
  app?: InputMaybe<Scalars['String']>;
  pk?: InputMaybe<Scalars['ID']>;
  subscriber?: InputMaybe<Scalars['Email']>;
};


export type GQLQueryUserArgs = {
  email?: InputMaybe<Scalars['Email']>;
};

export type GQLSecret = {
  __typename?: 'Secret';
  createdAt: Scalars['Timestamp'];
  deleteSecret?: Maybe<GQLSecret>;
  expireAt?: Maybe<Scalars['Timestamp']>;
  key: Scalars['String'];
  value: Scalars['String'];
};

export enum GQLSortDirection {
  Ascending = 'ascending',
  Descending = 'descending'
}

export type GQLStripePaymentAccept = {
  __typename?: 'StripePaymentAccept';
  amountCents: Scalars['Int'];
  createdAt: Scalars['Timestamp'];
  currency: Scalars['String'];
  settlePayment?: Maybe<GQLStripePaymentAccept>;
  stripePaymentIntent: Scalars['String'];
  stripePaymentStatus: Scalars['String'];
  stripeSessionId: Scalars['String'];
  stripeSessionObject: Scalars['String'];
  updateStripePaymentAccept?: Maybe<GQLStripePaymentAccept>;
  user: GQLUser;
};


export type GQLStripePaymentAcceptSettlePaymentArgs = {
  stripeSessionObject: Scalars['String'];
};


export type GQLStripePaymentAcceptUpdateStripePaymentAcceptArgs = {
  stripePaymentStatus?: InputMaybe<Scalars['String']>;
  stripeSessionObject?: InputMaybe<Scalars['String']>;
};

export type GQLStripeTransfer = {
  __typename?: 'StripeTransfer';
  createdAt: Scalars['Timestamp'];
  currency?: Maybe<Scalars['String']>;
  receiveCents: Scalars['Int'];
  receiver: GQLUser;
  settleStripeTransfer?: Maybe<GQLStripeTransfer>;
  stripeTransferId: Scalars['String'];
  stripeTransferObject: Scalars['String'];
  withdrawCents: Scalars['Int'];
};

export type GQLSubscribe = {
  __typename?: 'Subscribe';
  app: GQLApp;
  createdAt: Scalars['Timestamp'];
  deleteSubscription?: Maybe<GQLSubscribe>;
  pk: Scalars['String'];
  pricing: GQLPricing;
  subscriber: GQLUser;
  updateSubscription?: Maybe<GQLSubscribe>;
  updatedAt: Scalars['Timestamp'];
};


export type GQLSubscribeUpdateSubscriptionArgs = {
  pricing?: InputMaybe<Scalars['ID']>;
};

export type GQLUsageLog = {
  __typename?: 'UsageLog';
  app: GQLApp;
  collectedAt: Scalars['Timestamp'];
  createdAt: Scalars['Timestamp'];
  endpoint: GQLEndpoint;
  status: Scalars['String'];
  subscriber: GQLUser;
  volume: Scalars['Int'];
};

export type GQLUsageSummary = {
  __typename?: 'UsageSummary';
  app: GQLApp;
  billed: Scalars['Boolean'];
  billedAt?: Maybe<Scalars['Timestamp']>;
  billingAccountActivity?: Maybe<GQLAccountActivity>;
  createdAt: Scalars['Timestamp'];
  subscriber: GQLUser;
  volume: Scalars['Int'];
};

export type GQLUser = {
  __typename?: 'User';
  accountActivities: Array<GQLAccountActivity>;
  accountHistories: Array<GQLAccountHistory>;
  apps: Array<GQLApp>;
  author: Scalars['String'];
  balance?: Maybe<Scalars['String']>;
  email: Scalars['Email'];
  stripeConnectAccountId?: Maybe<Scalars['String']>;
  stripeCustomerId?: Maybe<Scalars['String']>;
  subscriptions: Array<GQLSubscribe>;
  updateUser?: Maybe<GQLUser>;
  usageLogs: Array<GQLUsageLog>;
  usageSummaries: Array<GQLUsageSummary>;
};


export type GQLUserAccountActivitiesArgs = {
  dateRange?: InputMaybe<GQLDateRangeInput>;
  limit?: InputMaybe<Scalars['Int']>;
};


export type GQLUserAccountHistoriesArgs = {
  dateRange?: InputMaybe<GQLDateRangeInput>;
  limit?: InputMaybe<Scalars['Int']>;
};


export type GQLUserUpdateUserArgs = {
  stripeConnectAccountId?: InputMaybe<Scalars['String']>;
  stripeCustomerId?: InputMaybe<Scalars['String']>;
};


export type GQLUserUsageLogsArgs = {
  app?: InputMaybe<Scalars['String']>;
  dateRange?: InputMaybe<GQLDateRangeInput>;
  limit?: InputMaybe<Scalars['Int']>;
  path?: InputMaybe<Scalars['String']>;
};


export type GQLUserUsageSummariesArgs = {
  app: Scalars['ID'];
  dateRange?: InputMaybe<GQLDateRangeInput>;
  limit?: InputMaybe<Scalars['Int']>;
};

export type GQLGetAccountBalanceQueryVariables = Exact<{
  email: Scalars['Email'];
}>;


export type GQLGetAccountBalanceQuery = { __typename?: 'Query', user: { __typename?: 'User', balance?: string | null } };

export type GQLGetAccountActivitiesQueryVariables = Exact<{
  email: Scalars['Email'];
  dateRange: GQLDateRangeInput;
}>;


export type GQLGetAccountActivitiesQuery = { __typename?: 'Query', user: { __typename?: 'User', accountActivities: Array<{ __typename?: 'AccountActivity', createdAt: number, type: GQLAccountActivityType, amount: string, reason: GQLAccountActivityReason, description: string }> } };

export type GQLGetAccountHistoriesQueryVariables = Exact<{
  email: Scalars['Email'];
  dateRange: GQLDateRangeInput;
}>;


export type GQLGetAccountHistoriesQuery = { __typename?: 'Query', user: { __typename?: 'User', accountHistories: Array<{ __typename?: 'AccountHistory', closingBalance: string, closingTime: number }> } };

export type GQLGetUserAppsQueryVariables = Exact<{
  email: Scalars['Email'];
}>;


export type GQLGetUserAppsQuery = { __typename?: 'Query', user: { __typename?: 'User', apps: Array<{ __typename?: 'App', name: string, description: string }> } };

export type GQLGetAvailablePlansQueryVariables = Exact<{
  appName: Scalars['String'];
}>;


export type GQLGetAvailablePlansQuery = { __typename?: 'Query', app: { __typename?: 'App', pricingPlans: Array<{ __typename?: 'Pricing', name: string, pk: string, minMonthlyCharge: string, chargePerRequest: string, freeQuota: number, callToAction: string }> } };

export type GQLGetUserSubscriptionDetailQueryVariables = Exact<{
  user: Scalars['Email'];
  appName: Scalars['String'];
}>;


export type GQLGetUserSubscriptionDetailQuery = { __typename?: 'Query', subscription: { __typename?: 'Subscribe', pricing: { __typename?: 'Pricing', pk: string, name: string } } };

export type GQLGetSubscriptionDetailAppInfoQueryVariables = Exact<{
  appName: Scalars['String'];
}>;


export type GQLGetSubscriptionDetailAppInfoQuery = { __typename?: 'Query', app: { __typename?: 'App', name: string, description: string } };

export type GQLGetUsageSummaryQueryVariables = Exact<{
  userEmail: Scalars['Email'];
  appName: Scalars['ID'];
  dateRange?: InputMaybe<GQLDateRangeInput>;
}>;


export type GQLGetUsageSummaryQuery = { __typename?: 'Query', user: { __typename?: 'User', usageSummaries: Array<{ __typename?: 'UsageSummary', createdAt: number, volume: number, billingAccountActivity?: { __typename?: 'AccountActivity', amount: string } | null }> } };

export type GQLGetUserSubscriptionsQueryVariables = Exact<{
  email: Scalars['Email'];
}>;


export type GQLGetUserSubscriptionsQuery = { __typename?: 'Query', user: { __typename?: 'User', subscriptions: Array<{ __typename?: 'Subscribe', pk: string, pricing: { __typename?: 'Pricing', name: string }, app: { __typename?: 'App', name: string, owner: { __typename?: 'User', author: string } } }> } };

export type GQLPutSecretMutationVariables = Exact<{
  key: Scalars['String'];
  value: Scalars['String'];
  description?: InputMaybe<Scalars['String']>;
  expireAt?: InputMaybe<Scalars['Timestamp']>;
}>;


export type GQLPutSecretMutation = { __typename?: 'Mutation', createSecret: { __typename?: 'Secret', createdAt: number } };
