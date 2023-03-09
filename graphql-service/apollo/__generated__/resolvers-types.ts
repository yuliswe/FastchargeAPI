import type { GatewayMode } from '../dynamoose/models';
import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import type { App as AppData, User as UserData, Endpoint as EndpointData, Pricing as PricingData, Subscription as SubscriptionData, UsageLog as UsageLogData, StripePaymentAccept as StripePaymentAcceptData, StripeTransfer as StripeTransferData, AccountActivity as AccountActivityData, AccountHistory as AccountHistoryData, UsageSummary as UsageSummaryData, Secret as SecretData } from '../dynamoose/models';
import type { RequestContext } from '../RequestContext';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type EnumResolverSignature<T, AllowedValues = any> = { [key in keyof T]?: AllowedValues };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Email: string;
  NonNegativeDecimal: any;
  Timestamp: number;
};

export type GQLAccountActivity = {
  __typename?: 'AccountActivity';
  amount: Scalars['String'];
  billedApp?: Maybe<GQLApp>;
  createdAt: Scalars['Timestamp'];
  description: Scalars['String'];
  reason: GQLAccountActivityReason;
  settleAt: Scalars['Timestamp'];
  status?: Maybe<GQLAccountActivityStatus>;
  stripeTransfer?: Maybe<GQLStripeTransfer>;
  type: GQLAccountActivityType;
};

export enum GQLAccountActivityReason {
  ApiMinMonthlyCharge = 'api_min_monthly_charge',
  ApiMinMonthlyChargeUpgrade = 'api_min_monthly_charge_upgrade',
  ApiPerRequestCharge = 'api_per_request_charge',
  Payout = 'payout',
  PayoutFee = 'payout_fee',
  Topup = 'topup'
}

export enum GQLAccountActivityStatus {
  Pending = 'pending',
  Settled = 'settled'
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
  gatewayMode: GatewayMode;
  homepage?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  ownedByYou: Scalars['Boolean'];
  owner: GQLUser;
  pricingPlans: Array<GQLPricing>;
  repository?: Maybe<Scalars['String']>;
  revokeAppUserToken: Scalars['Boolean'];
  updateApp: GQLApp;
};


export type GQLAppUpdateAppArgs = {
  description?: InputMaybe<Scalars['String']>;
  gatewayMode?: InputMaybe<GatewayMode>;
};

export type GQLDateRangeInput = {
  end?: InputMaybe<Scalars['Timestamp']>;
  start?: InputMaybe<Scalars['Timestamp']>;
};

export type GQLEndpoint = {
  __typename?: 'Endpoint';
  createdAt: Scalars['Timestamp'];
  deleteEndpoint?: Maybe<GQLEndpoint>;
  description?: Maybe<Scalars['String']>;
  destination?: Maybe<Scalars['String']>;
  method: GQLHttpMethod;
  path: Scalars['String'];
  pk: Scalars['String'];
  updateEndpoint?: Maybe<GQLEndpoint>;
  updatedAt: Scalars['Timestamp'];
};


export type GQLEndpointUpdateEndpointArgs = {
  description?: InputMaybe<Scalars['String']>;
  destination?: InputMaybe<Scalars['String']>;
  method?: InputMaybe<GQLHttpMethod>;
  path?: InputMaybe<Scalars['String']>;
};

export type GQLGatewayDecisionResponse = {
  __typename?: 'GatewayDecisionResponse';
  allowed: Scalars['Boolean'];
  reason?: Maybe<GQLGatewayDecisionResponseReason>;
};

export enum GQLGatewayDecisionResponseReason {
  InsufficientBalance = 'insufficient_balance',
  NotSubscribed = 'not_subscribed',
  OwnerInsufficientBalance = 'owner_insufficient_balance',
  TooManyRequests = 'too_many_requests'
}

export { GatewayMode };

export enum GQLHttpMethod {
  Any = 'ANY',
  Delete = 'DELETE',
  Get = 'GET',
  Head = 'HEAD',
  Options = 'OPTIONS',
  Patch = 'PATCH',
  Post = 'POST',
  Put = 'PUT'
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
  gatewayMode?: InputMaybe<GatewayMode>;
  homepage?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  owner: Scalars['String'];
  repository?: InputMaybe<Scalars['String']>;
};


export type GQLMutationCreateEndpointArgs = {
  app: Scalars['String'];
  description?: InputMaybe<Scalars['String']>;
  destination: Scalars['String'];
  method: GQLHttpMethod;
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
  amount: Scalars['NonNegativeDecimal'];
  currency: Scalars['String'];
  stripePaymentIntent: Scalars['String'];
  stripePaymentStatus: Scalars['String'];
  stripeSessionId: Scalars['String'];
  stripeSessionObject: Scalars['String'];
  user: Scalars['String'];
};


export type GQLMutationCreateStripeTransferArgs = {
  currency: Scalars['String'];
  receiveAmount: Scalars['NonNegativeDecimal'];
  receiver: Scalars['Email'];
  stripeTransferId?: InputMaybe<Scalars['String']>;
  stripeTransferObject?: InputMaybe<Scalars['String']>;
  withdrawAmount: Scalars['NonNegativeDecimal'];
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
  checkUserIsAllowedForGatewayRequest: GQLGatewayDecisionResponse;
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


export type GQLQueryCheckUserIsAllowedForGatewayRequestArgs = {
  app: Scalars['ID'];
  forceBalanceCheck?: InputMaybe<Scalars['Boolean']>;
  user: Scalars['ID'];
};


export type GQLQueryEndpointArgs = {
  app?: InputMaybe<Scalars['String']>;
  path?: InputMaybe<Scalars['String']>;
  pk?: InputMaybe<Scalars['ID']>;
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
  amount: Scalars['NonNegativeDecimal'];
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
  receiveAmount: Scalars['NonNegativeDecimal'];
  receiver: GQLUser;
  settleStripeTransfer: GQLStripeTransfer;
  status?: Maybe<GQLStripeTransferStatus>;
  stripeTransferId?: Maybe<Scalars['String']>;
  stripeTransferObject?: Maybe<Scalars['String']>;
  transferAt: Scalars['Timestamp'];
  withdrawAmount: Scalars['NonNegativeDecimal'];
};

export enum GQLStripeTransferStatus {
  Pending = 'pending',
  Transferred = 'transferred'
}

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
  balance: Scalars['String'];
  createdAt: Scalars['Timestamp'];
  email: Scalars['Email'];
  stripeConnectAccountId?: Maybe<Scalars['String']>;
  stripeCustomerId?: Maybe<Scalars['String']>;
  subscriptions: Array<GQLSubscribe>;
  updateUser?: Maybe<GQLUser>;
  updatedAt: Scalars['Timestamp'];
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
  author?: InputMaybe<Scalars['String']>;
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

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type GQLResolversTypes = ResolversObject<{
  AccountActivity: ResolverTypeWrapper<AccountActivityData>;
  AccountActivityReason: GQLAccountActivityReason;
  AccountActivityStatus: GQLAccountActivityStatus;
  AccountActivityType: GQLAccountActivityType;
  AccountHistory: ResolverTypeWrapper<AccountHistoryData>;
  App: ResolverTypeWrapper<AppData>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  DateRangeInput: GQLDateRangeInput;
  Email: ResolverTypeWrapper<Scalars['Email']>;
  Endpoint: ResolverTypeWrapper<EndpointData>;
  GatewayDecisionResponse: ResolverTypeWrapper<GQLGatewayDecisionResponse>;
  GatewayDecisionResponseReason: GQLGatewayDecisionResponseReason;
  GatewayMode: GatewayMode;
  HTTPMethod: GQLHttpMethod;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  Mutation: ResolverTypeWrapper<{}>;
  NonNegativeDecimal: ResolverTypeWrapper<Scalars['NonNegativeDecimal']>;
  Pricing: ResolverTypeWrapper<PricingData>;
  Query: ResolverTypeWrapper<{}>;
  Secret: ResolverTypeWrapper<SecretData>;
  SortDirection: GQLSortDirection;
  String: ResolverTypeWrapper<Scalars['String']>;
  StripePaymentAccept: ResolverTypeWrapper<StripePaymentAcceptData>;
  StripeTransfer: ResolverTypeWrapper<StripeTransferData>;
  StripeTransferStatus: GQLStripeTransferStatus;
  Subscribe: ResolverTypeWrapper<SubscriptionData>;
  Timestamp: ResolverTypeWrapper<Scalars['Timestamp']>;
  UsageLog: ResolverTypeWrapper<UsageLogData>;
  UsageSummary: ResolverTypeWrapper<UsageSummaryData>;
  User: ResolverTypeWrapper<UserData>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type GQLResolversParentTypes = ResolversObject<{
  AccountActivity: AccountActivityData;
  AccountHistory: AccountHistoryData;
  App: AppData;
  Boolean: Scalars['Boolean'];
  DateRangeInput: GQLDateRangeInput;
  Email: Scalars['Email'];
  Endpoint: EndpointData;
  GatewayDecisionResponse: GQLGatewayDecisionResponse;
  ID: Scalars['ID'];
  Int: Scalars['Int'];
  Mutation: {};
  NonNegativeDecimal: Scalars['NonNegativeDecimal'];
  Pricing: PricingData;
  Query: {};
  Secret: SecretData;
  String: Scalars['String'];
  StripePaymentAccept: StripePaymentAcceptData;
  StripeTransfer: StripeTransferData;
  Subscribe: SubscriptionData;
  Timestamp: Scalars['Timestamp'];
  UsageLog: UsageLogData;
  UsageSummary: UsageSummaryData;
  User: UserData;
}>;

export type GQLAccountActivityResolvers<ContextType = RequestContext, ParentType extends GQLResolversParentTypes['AccountActivity'] = GQLResolversParentTypes['AccountActivity']> = ResolversObject<{
  amount?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  billedApp?: Resolver<Maybe<GQLResolversTypes['App']>, ParentType, ContextType>;
  createdAt?: Resolver<GQLResolversTypes['Timestamp'], ParentType, ContextType>;
  description?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  reason?: Resolver<GQLResolversTypes['AccountActivityReason'], ParentType, ContextType>;
  settleAt?: Resolver<GQLResolversTypes['Timestamp'], ParentType, ContextType>;
  status?: Resolver<Maybe<GQLResolversTypes['AccountActivityStatus']>, ParentType, ContextType>;
  stripeTransfer?: Resolver<Maybe<GQLResolversTypes['StripeTransfer']>, ParentType, ContextType>;
  type?: Resolver<GQLResolversTypes['AccountActivityType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GQLAccountHistoryResolvers<ContextType = RequestContext, ParentType extends GQLResolversParentTypes['AccountHistory'] = GQLResolversParentTypes['AccountHistory']> = ResolversObject<{
  closingBalance?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  closingTime?: Resolver<GQLResolversTypes['Timestamp'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GQLAppResolvers<ContextType = RequestContext, ParentType extends GQLResolversParentTypes['App'] = GQLResolversParentTypes['App']> = ResolversObject<{
  createAppUserToken?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  deleteApp?: Resolver<GQLResolversTypes['App'], ParentType, ContextType>;
  description?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  endpoints?: Resolver<Array<GQLResolversTypes['Endpoint']>, ParentType, ContextType>;
  gatewayMode?: Resolver<GQLResolversTypes['GatewayMode'], ParentType, ContextType>;
  homepage?: Resolver<Maybe<GQLResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  ownedByYou?: Resolver<GQLResolversTypes['Boolean'], ParentType, ContextType>;
  owner?: Resolver<GQLResolversTypes['User'], ParentType, ContextType>;
  pricingPlans?: Resolver<Array<GQLResolversTypes['Pricing']>, ParentType, ContextType>;
  repository?: Resolver<Maybe<GQLResolversTypes['String']>, ParentType, ContextType>;
  revokeAppUserToken?: Resolver<GQLResolversTypes['Boolean'], ParentType, ContextType>;
  updateApp?: Resolver<GQLResolversTypes['App'], ParentType, ContextType, Partial<GQLAppUpdateAppArgs>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface GQLEmailScalarConfig extends GraphQLScalarTypeConfig<GQLResolversTypes['Email'], any> {
  name: 'Email';
}

export type GQLEndpointResolvers<ContextType = RequestContext, ParentType extends GQLResolversParentTypes['Endpoint'] = GQLResolversParentTypes['Endpoint']> = ResolversObject<{
  createdAt?: Resolver<GQLResolversTypes['Timestamp'], ParentType, ContextType>;
  deleteEndpoint?: Resolver<Maybe<GQLResolversTypes['Endpoint']>, ParentType, ContextType>;
  description?: Resolver<Maybe<GQLResolversTypes['String']>, ParentType, ContextType>;
  destination?: Resolver<Maybe<GQLResolversTypes['String']>, ParentType, ContextType>;
  method?: Resolver<GQLResolversTypes['HTTPMethod'], ParentType, ContextType>;
  path?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  pk?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  updateEndpoint?: Resolver<Maybe<GQLResolversTypes['Endpoint']>, ParentType, ContextType, Partial<GQLEndpointUpdateEndpointArgs>>;
  updatedAt?: Resolver<GQLResolversTypes['Timestamp'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GQLGatewayDecisionResponseResolvers<ContextType = RequestContext, ParentType extends GQLResolversParentTypes['GatewayDecisionResponse'] = GQLResolversParentTypes['GatewayDecisionResponse']> = ResolversObject<{
  allowed?: Resolver<GQLResolversTypes['Boolean'], ParentType, ContextType>;
  reason?: Resolver<Maybe<GQLResolversTypes['GatewayDecisionResponseReason']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GQLGatewayModeResolvers = EnumResolverSignature<{ proxy?: any, redirect?: any }, GQLResolversTypes['GatewayMode']>;

export type GQLMutationResolvers<ContextType = RequestContext, ParentType extends GQLResolversParentTypes['Mutation'] = GQLResolversParentTypes['Mutation']> = ResolversObject<{
  createApp?: Resolver<GQLResolversTypes['App'], ParentType, ContextType, RequireFields<GQLMutationCreateAppArgs, 'gatewayMode' | 'name' | 'owner'>>;
  createEndpoint?: Resolver<GQLResolversTypes['Endpoint'], ParentType, ContextType, RequireFields<GQLMutationCreateEndpointArgs, 'app' | 'destination' | 'method' | 'path'>>;
  createPricing?: Resolver<GQLResolversTypes['Pricing'], ParentType, ContextType, RequireFields<GQLMutationCreatePricingArgs, 'app' | 'callToAction' | 'chargePerRequest' | 'minMonthlyCharge' | 'name'>>;
  createSecret?: Resolver<GQLResolversTypes['Secret'], ParentType, ContextType, RequireFields<GQLMutationCreateSecretArgs, 'key' | 'value'>>;
  createStripePaymentAccept?: Resolver<GQLResolversTypes['StripePaymentAccept'], ParentType, ContextType, RequireFields<GQLMutationCreateStripePaymentAcceptArgs, 'amount' | 'currency' | 'stripePaymentIntent' | 'stripePaymentStatus' | 'stripeSessionId' | 'stripeSessionObject' | 'user'>>;
  createStripeTransfer?: Resolver<GQLResolversTypes['StripeTransfer'], ParentType, ContextType, RequireFields<GQLMutationCreateStripeTransferArgs, 'currency' | 'receiveAmount' | 'receiver' | 'withdrawAmount'>>;
  createSubscription?: Resolver<GQLResolversTypes['Subscribe'], ParentType, ContextType, RequireFields<GQLMutationCreateSubscriptionArgs, 'app' | 'pricing' | 'subscriber'>>;
  createUsageLog?: Resolver<GQLResolversTypes['UsageLog'], ParentType, ContextType, RequireFields<GQLMutationCreateUsageLogArgs, 'app' | 'path' | 'subscriber' | 'volume'>>;
  createUser?: Resolver<GQLResolversTypes['User'], ParentType, ContextType, RequireFields<GQLMutationCreateUserArgs, 'email'>>;
  triggerBilling?: Resolver<Maybe<GQLResolversTypes['UsageSummary']>, ParentType, ContextType, RequireFields<GQLMutationTriggerBillingArgs, 'app' | 'user'>>;
}>;

export interface GQLNonNegativeDecimalScalarConfig extends GraphQLScalarTypeConfig<GQLResolversTypes['NonNegativeDecimal'], any> {
  name: 'NonNegativeDecimal';
}

export type GQLPricingResolvers<ContextType = RequestContext, ParentType extends GQLResolversParentTypes['Pricing'] = GQLResolversParentTypes['Pricing']> = ResolversObject<{
  app?: Resolver<GQLResolversTypes['App'], ParentType, ContextType>;
  callToAction?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  chargePerRequest?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  deletePricing?: Resolver<Maybe<GQLResolversTypes['Pricing']>, ParentType, ContextType>;
  freeQuota?: Resolver<GQLResolversTypes['Int'], ParentType, ContextType>;
  minMonthlyCharge?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  pk?: Resolver<GQLResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GQLQueryResolvers<ContextType = RequestContext, ParentType extends GQLResolversParentTypes['Query'] = GQLResolversParentTypes['Query']> = ResolversObject<{
  app?: Resolver<GQLResolversTypes['App'], ParentType, ContextType, Partial<GQLQueryAppArgs>>;
  apps?: Resolver<Maybe<Array<Maybe<GQLResolversTypes['App']>>>, ParentType, ContextType>;
  checkUserIsAllowedForGatewayRequest?: Resolver<GQLResolversTypes['GatewayDecisionResponse'], ParentType, ContextType, RequireFields<GQLQueryCheckUserIsAllowedForGatewayRequestArgs, 'app' | 'user'>>;
  endpoint?: Resolver<GQLResolversTypes['Endpoint'], ParentType, ContextType, Partial<GQLQueryEndpointArgs>>;
  endpoints?: Resolver<Maybe<Array<Maybe<GQLResolversTypes['Endpoint']>>>, ParentType, ContextType>;
  secret?: Resolver<GQLResolversTypes['Secret'], ParentType, ContextType, RequireFields<GQLQuerySecretArgs, 'key'>>;
  stripePaymentAccept?: Resolver<GQLResolversTypes['StripePaymentAccept'], ParentType, ContextType, RequireFields<GQLQueryStripePaymentAcceptArgs, 'stripeSessionId'>>;
  subscription?: Resolver<GQLResolversTypes['Subscribe'], ParentType, ContextType, Partial<GQLQuerySubscriptionArgs>>;
  user?: Resolver<GQLResolversTypes['User'], ParentType, ContextType, Partial<GQLQueryUserArgs>>;
  users?: Resolver<Maybe<Array<Maybe<GQLResolversTypes['User']>>>, ParentType, ContextType>;
}>;

export type GQLSecretResolvers<ContextType = RequestContext, ParentType extends GQLResolversParentTypes['Secret'] = GQLResolversParentTypes['Secret']> = ResolversObject<{
  createdAt?: Resolver<GQLResolversTypes['Timestamp'], ParentType, ContextType>;
  deleteSecret?: Resolver<Maybe<GQLResolversTypes['Secret']>, ParentType, ContextType>;
  expireAt?: Resolver<Maybe<GQLResolversTypes['Timestamp']>, ParentType, ContextType>;
  key?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GQLStripePaymentAcceptResolvers<ContextType = RequestContext, ParentType extends GQLResolversParentTypes['StripePaymentAccept'] = GQLResolversParentTypes['StripePaymentAccept']> = ResolversObject<{
  amount?: Resolver<GQLResolversTypes['NonNegativeDecimal'], ParentType, ContextType>;
  createdAt?: Resolver<GQLResolversTypes['Timestamp'], ParentType, ContextType>;
  currency?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  settlePayment?: Resolver<Maybe<GQLResolversTypes['StripePaymentAccept']>, ParentType, ContextType, RequireFields<GQLStripePaymentAcceptSettlePaymentArgs, 'stripeSessionObject'>>;
  stripePaymentIntent?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  stripePaymentStatus?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  stripeSessionId?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  stripeSessionObject?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  updateStripePaymentAccept?: Resolver<Maybe<GQLResolversTypes['StripePaymentAccept']>, ParentType, ContextType, Partial<GQLStripePaymentAcceptUpdateStripePaymentAcceptArgs>>;
  user?: Resolver<GQLResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GQLStripeTransferResolvers<ContextType = RequestContext, ParentType extends GQLResolversParentTypes['StripeTransfer'] = GQLResolversParentTypes['StripeTransfer']> = ResolversObject<{
  createdAt?: Resolver<GQLResolversTypes['Timestamp'], ParentType, ContextType>;
  currency?: Resolver<Maybe<GQLResolversTypes['String']>, ParentType, ContextType>;
  receiveAmount?: Resolver<GQLResolversTypes['NonNegativeDecimal'], ParentType, ContextType>;
  receiver?: Resolver<GQLResolversTypes['User'], ParentType, ContextType>;
  settleStripeTransfer?: Resolver<GQLResolversTypes['StripeTransfer'], ParentType, ContextType>;
  status?: Resolver<Maybe<GQLResolversTypes['StripeTransferStatus']>, ParentType, ContextType>;
  stripeTransferId?: Resolver<Maybe<GQLResolversTypes['String']>, ParentType, ContextType>;
  stripeTransferObject?: Resolver<Maybe<GQLResolversTypes['String']>, ParentType, ContextType>;
  transferAt?: Resolver<GQLResolversTypes['Timestamp'], ParentType, ContextType>;
  withdrawAmount?: Resolver<GQLResolversTypes['NonNegativeDecimal'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GQLSubscribeResolvers<ContextType = RequestContext, ParentType extends GQLResolversParentTypes['Subscribe'] = GQLResolversParentTypes['Subscribe']> = ResolversObject<{
  app?: Resolver<GQLResolversTypes['App'], ParentType, ContextType>;
  createdAt?: Resolver<GQLResolversTypes['Timestamp'], ParentType, ContextType>;
  deleteSubscription?: Resolver<Maybe<GQLResolversTypes['Subscribe']>, ParentType, ContextType>;
  pk?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  pricing?: Resolver<GQLResolversTypes['Pricing'], ParentType, ContextType>;
  subscriber?: Resolver<GQLResolversTypes['User'], ParentType, ContextType>;
  updateSubscription?: Resolver<Maybe<GQLResolversTypes['Subscribe']>, ParentType, ContextType, Partial<GQLSubscribeUpdateSubscriptionArgs>>;
  updatedAt?: Resolver<GQLResolversTypes['Timestamp'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface GQLTimestampScalarConfig extends GraphQLScalarTypeConfig<GQLResolversTypes['Timestamp'], any> {
  name: 'Timestamp';
}

export type GQLUsageLogResolvers<ContextType = RequestContext, ParentType extends GQLResolversParentTypes['UsageLog'] = GQLResolversParentTypes['UsageLog']> = ResolversObject<{
  app?: Resolver<GQLResolversTypes['App'], ParentType, ContextType>;
  collectedAt?: Resolver<GQLResolversTypes['Timestamp'], ParentType, ContextType>;
  createdAt?: Resolver<GQLResolversTypes['Timestamp'], ParentType, ContextType>;
  endpoint?: Resolver<GQLResolversTypes['Endpoint'], ParentType, ContextType>;
  status?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  subscriber?: Resolver<GQLResolversTypes['User'], ParentType, ContextType>;
  volume?: Resolver<GQLResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GQLUsageSummaryResolvers<ContextType = RequestContext, ParentType extends GQLResolversParentTypes['UsageSummary'] = GQLResolversParentTypes['UsageSummary']> = ResolversObject<{
  app?: Resolver<GQLResolversTypes['App'], ParentType, ContextType>;
  billed?: Resolver<GQLResolversTypes['Boolean'], ParentType, ContextType>;
  billedAt?: Resolver<Maybe<GQLResolversTypes['Timestamp']>, ParentType, ContextType>;
  billingAccountActivity?: Resolver<Maybe<GQLResolversTypes['AccountActivity']>, ParentType, ContextType>;
  createdAt?: Resolver<GQLResolversTypes['Timestamp'], ParentType, ContextType>;
  subscriber?: Resolver<GQLResolversTypes['User'], ParentType, ContextType>;
  volume?: Resolver<GQLResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GQLUserResolvers<ContextType = RequestContext, ParentType extends GQLResolversParentTypes['User'] = GQLResolversParentTypes['User']> = ResolversObject<{
  accountActivities?: Resolver<Array<GQLResolversTypes['AccountActivity']>, ParentType, ContextType, RequireFields<GQLUserAccountActivitiesArgs, 'limit'>>;
  accountHistories?: Resolver<Array<GQLResolversTypes['AccountHistory']>, ParentType, ContextType, RequireFields<GQLUserAccountHistoriesArgs, 'limit'>>;
  apps?: Resolver<Array<GQLResolversTypes['App']>, ParentType, ContextType>;
  author?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  balance?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<GQLResolversTypes['Timestamp'], ParentType, ContextType>;
  email?: Resolver<GQLResolversTypes['Email'], ParentType, ContextType>;
  stripeConnectAccountId?: Resolver<Maybe<GQLResolversTypes['String']>, ParentType, ContextType>;
  stripeCustomerId?: Resolver<Maybe<GQLResolversTypes['String']>, ParentType, ContextType>;
  subscriptions?: Resolver<Array<GQLResolversTypes['Subscribe']>, ParentType, ContextType>;
  updateUser?: Resolver<Maybe<GQLResolversTypes['User']>, ParentType, ContextType, Partial<GQLUserUpdateUserArgs>>;
  updatedAt?: Resolver<GQLResolversTypes['Timestamp'], ParentType, ContextType>;
  usageLogs?: Resolver<Array<GQLResolversTypes['UsageLog']>, ParentType, ContextType, RequireFields<GQLUserUsageLogsArgs, 'limit'>>;
  usageSummaries?: Resolver<Array<GQLResolversTypes['UsageSummary']>, ParentType, ContextType, RequireFields<GQLUserUsageSummariesArgs, 'app' | 'limit'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GQLResolvers<ContextType = RequestContext> = ResolversObject<{
  AccountActivity?: GQLAccountActivityResolvers<ContextType>;
  AccountHistory?: GQLAccountHistoryResolvers<ContextType>;
  App?: GQLAppResolvers<ContextType>;
  Email?: GraphQLScalarType;
  Endpoint?: GQLEndpointResolvers<ContextType>;
  GatewayDecisionResponse?: GQLGatewayDecisionResponseResolvers<ContextType>;
  GatewayMode?: GQLGatewayModeResolvers;
  Mutation?: GQLMutationResolvers<ContextType>;
  NonNegativeDecimal?: GraphQLScalarType;
  Pricing?: GQLPricingResolvers<ContextType>;
  Query?: GQLQueryResolvers<ContextType>;
  Secret?: GQLSecretResolvers<ContextType>;
  StripePaymentAccept?: GQLStripePaymentAcceptResolvers<ContextType>;
  StripeTransfer?: GQLStripeTransferResolvers<ContextType>;
  Subscribe?: GQLSubscribeResolvers<ContextType>;
  Timestamp?: GraphQLScalarType;
  UsageLog?: GQLUsageLogResolvers<ContextType>;
  UsageSummary?: GQLUsageSummaryResolvers<ContextType>;
  User?: GQLUserResolvers<ContextType>;
}>;

