import type { GatewayMode } from '../dynamoose/models';
import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import type { App as AppData, User as UserData, Endpoint as EndpointData, Pricing as PricingData, Subscribe as SubscribeData, UsageLog as UsageLogData, StripePaymentAccept as StripePaymentAcceptData, StripeTransfer as StripeTransferData, AccountActivity as AccountActivityData, AccountHistory as AccountHistoryData, UsageSummary as UsageSummaryData } from '../dynamoose/models';
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
  Date: any;
  Email: string;
  NonNegativeDecimal: any;
  Timestamp: any;
};

export type GQLApp = {
  __typename?: 'App';
  deleteApp?: Maybe<GQLApp>;
  description?: Maybe<Scalars['String']>;
  endpoints?: Maybe<Array<Maybe<GQLEndpoint>>>;
  gatewayMode?: Maybe<GatewayMode>;
  name: Scalars['String'];
  ownedByYou?: Maybe<Scalars['Boolean']>;
  owner?: Maybe<GQLUser>;
  pricingPlans?: Maybe<Array<Maybe<GQLPricing>>>;
  updateApp?: Maybe<GQLApp>;
};


export type GQLAppUpdateAppArgs = {
  description?: InputMaybe<Scalars['String']>;
  gatewayMode?: InputMaybe<GatewayMode>;
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

export { GatewayMode };

export type GQLMutation = {
  __typename?: 'Mutation';
  createApp?: Maybe<GQLApp>;
  createEndpoint?: Maybe<GQLEndpoint>;
  createPricing?: Maybe<GQLPricing>;
  createStripePaymentAccept?: Maybe<GQLStripePaymentAccept>;
  createStripeTransfer?: Maybe<GQLStripeTransfer>;
  createSubscription?: Maybe<GQLSubscribe>;
  createUsageLog?: Maybe<GQLUsageLog>;
  createUser?: Maybe<GQLUser>;
  triggerBilling?: Maybe<GQLUsageSummary>;
};


export type GQLMutationCreateAppArgs = {
  description?: InputMaybe<Scalars['String']>;
  gatewayMode?: InputMaybe<GatewayMode>;
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


export type GQLMutationCreateStripePaymentAcceptArgs = {
  amountCents: Scalars['Int'];
  currency: Scalars['String'];
  status: Scalars['String'];
  stripePaymentIntent: Scalars['String'];
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
  app?: Maybe<GQLApp>;
  apps?: Maybe<Array<Maybe<GQLApp>>>;
  endpoint?: Maybe<GQLEndpoint>;
  endpoints?: Maybe<Array<Maybe<GQLEndpoint>>>;
  stripePaymentAccept?: Maybe<GQLStripePaymentAccept>;
  subscription?: Maybe<GQLSubscribe>;
  user?: Maybe<GQLUser>;
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


export type GQLQueryStripePaymentAcceptArgs = {
  stripeSessionId: Scalars['String'];
};


export type GQLQuerySubscriptionArgs = {
  app?: InputMaybe<Scalars['String']>;
  subscriber?: InputMaybe<Scalars['Email']>;
};


export type GQLQueryUserArgs = {
  email?: InputMaybe<Scalars['Email']>;
};

export type GQLStripePaymentAccept = {
  __typename?: 'StripePaymentAccept';
  amountCents: Scalars['Int'];
  createdAt: Scalars['Timestamp'];
  currency: Scalars['String'];
  settlePayment?: Maybe<GQLStripePaymentAccept>;
  status: Scalars['String'];
  stripePaymentIntent: Scalars['String'];
  stripeSessionId: Scalars['String'];
  stripeSessionObject: Scalars['String'];
  user: GQLUser;
};


export type GQLStripePaymentAcceptSettlePaymentArgs = {
  stripeSessionObject: Scalars['String'];
};

export type GQLStripeTransfer = {
  __typename?: 'StripeTransfer';
  createdAt: Scalars['Timestamp'];
  currency?: Maybe<Scalars['String']>;
  newBalance?: Maybe<Scalars['String']>;
  oldBalance?: Maybe<Scalars['String']>;
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
  createdAt: Scalars['Int'];
  deleteSubscription?: Maybe<GQLSubscribe>;
  pricing: GQLPricing;
  subscriber: GQLUser;
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
  createdAt: Scalars['Timestamp'];
};

export type GQLUser = {
  __typename?: 'User';
  apps?: Maybe<Array<Maybe<GQLApp>>>;
  author: Scalars['String'];
  balance?: Maybe<Scalars['String']>;
  email: Scalars['Email'];
  stripeConnectAccountId?: Maybe<Scalars['String']>;
  stripeCustomerId?: Maybe<Scalars['String']>;
  subscriptions?: Maybe<Array<Maybe<GQLSubscribe>>>;
  updateUser?: Maybe<GQLUser>;
  usageLogs?: Maybe<Array<Maybe<GQLUsageLog>>>;
  usageSummaries?: Maybe<Array<Maybe<GQLUsageSummary>>>;
};


export type GQLUserUpdateUserArgs = {
  stripeConnectAccountId?: InputMaybe<Scalars['String']>;
  stripeCustomerId?: InputMaybe<Scalars['String']>;
};


export type GQLUserUsageLogsArgs = {
  app?: InputMaybe<Scalars['String']>;
  limit?: InputMaybe<Scalars['Int']>;
  path?: InputMaybe<Scalars['String']>;
  start?: InputMaybe<Scalars['Int']>;
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
  App: ResolverTypeWrapper<AppData>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  Date: ResolverTypeWrapper<Scalars['Date']>;
  Email: ResolverTypeWrapper<Scalars['Email']>;
  Endpoint: ResolverTypeWrapper<EndpointData>;
  GatewayMode: GatewayMode;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  Mutation: ResolverTypeWrapper<{}>;
  NonNegativeDecimal: ResolverTypeWrapper<Scalars['NonNegativeDecimal']>;
  Pricing: ResolverTypeWrapper<PricingData>;
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars['String']>;
  StripePaymentAccept: ResolverTypeWrapper<StripePaymentAcceptData>;
  StripeTransfer: ResolverTypeWrapper<StripeTransferData>;
  Subscribe: ResolverTypeWrapper<SubscribeData>;
  Timestamp: ResolverTypeWrapper<Scalars['Timestamp']>;
  UsageLog: ResolverTypeWrapper<UsageLogData>;
  UsageSummary: ResolverTypeWrapper<UsageSummaryData>;
  User: ResolverTypeWrapper<UserData>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type GQLResolversParentTypes = ResolversObject<{
  App: AppData;
  Boolean: Scalars['Boolean'];
  Date: Scalars['Date'];
  Email: Scalars['Email'];
  Endpoint: EndpointData;
  ID: Scalars['ID'];
  Int: Scalars['Int'];
  Mutation: {};
  NonNegativeDecimal: Scalars['NonNegativeDecimal'];
  Pricing: PricingData;
  Query: {};
  String: Scalars['String'];
  StripePaymentAccept: StripePaymentAcceptData;
  StripeTransfer: StripeTransferData;
  Subscribe: SubscribeData;
  Timestamp: Scalars['Timestamp'];
  UsageLog: UsageLogData;
  UsageSummary: UsageSummaryData;
  User: UserData;
}>;

export type GQLAppResolvers<ContextType = RequestContext, ParentType extends GQLResolversParentTypes['App'] = GQLResolversParentTypes['App']> = ResolversObject<{
  deleteApp?: Resolver<Maybe<GQLResolversTypes['App']>, ParentType, ContextType>;
  description?: Resolver<Maybe<GQLResolversTypes['String']>, ParentType, ContextType>;
  endpoints?: Resolver<Maybe<Array<Maybe<GQLResolversTypes['Endpoint']>>>, ParentType, ContextType>;
  gatewayMode?: Resolver<Maybe<GQLResolversTypes['GatewayMode']>, ParentType, ContextType>;
  name?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  ownedByYou?: Resolver<Maybe<GQLResolversTypes['Boolean']>, ParentType, ContextType>;
  owner?: Resolver<Maybe<GQLResolversTypes['User']>, ParentType, ContextType>;
  pricingPlans?: Resolver<Maybe<Array<Maybe<GQLResolversTypes['Pricing']>>>, ParentType, ContextType>;
  updateApp?: Resolver<Maybe<GQLResolversTypes['App']>, ParentType, ContextType, Partial<GQLAppUpdateAppArgs>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface GQLDateScalarConfig extends GraphQLScalarTypeConfig<GQLResolversTypes['Date'], any> {
  name: 'Date';
}

export interface GQLEmailScalarConfig extends GraphQLScalarTypeConfig<GQLResolversTypes['Email'], any> {
  name: 'Email';
}

export type GQLEndpointResolvers<ContextType = RequestContext, ParentType extends GQLResolversParentTypes['Endpoint'] = GQLResolversParentTypes['Endpoint']> = ResolversObject<{
  deleteEndpoint?: Resolver<Maybe<GQLResolversTypes['Endpoint']>, ParentType, ContextType>;
  description?: Resolver<Maybe<GQLResolversTypes['String']>, ParentType, ContextType>;
  destination?: Resolver<Maybe<GQLResolversTypes['String']>, ParentType, ContextType>;
  path?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  ref?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  updateEndpoint?: Resolver<Maybe<GQLResolversTypes['Endpoint']>, ParentType, ContextType, Partial<GQLEndpointUpdateEndpointArgs>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GQLGatewayModeResolvers = EnumResolverSignature<{ proxy?: any, redirect?: any }, GQLResolversTypes['GatewayMode']>;

export type GQLMutationResolvers<ContextType = RequestContext, ParentType extends GQLResolversParentTypes['Mutation'] = GQLResolversParentTypes['Mutation']> = ResolversObject<{
  createApp?: Resolver<Maybe<GQLResolversTypes['App']>, ParentType, ContextType, RequireFields<GQLMutationCreateAppArgs, 'name' | 'owner'>>;
  createEndpoint?: Resolver<Maybe<GQLResolversTypes['Endpoint']>, ParentType, ContextType, RequireFields<GQLMutationCreateEndpointArgs, 'app' | 'destination' | 'path'>>;
  createPricing?: Resolver<Maybe<GQLResolversTypes['Pricing']>, ParentType, ContextType, RequireFields<GQLMutationCreatePricingArgs, 'app' | 'callToAction' | 'chargePerRequest' | 'minMonthlyCharge' | 'name'>>;
  createStripePaymentAccept?: Resolver<Maybe<GQLResolversTypes['StripePaymentAccept']>, ParentType, ContextType, RequireFields<GQLMutationCreateStripePaymentAcceptArgs, 'amountCents' | 'currency' | 'status' | 'stripePaymentIntent' | 'stripeSessionId' | 'stripeSessionObject' | 'user'>>;
  createStripeTransfer?: Resolver<Maybe<GQLResolversTypes['StripeTransfer']>, ParentType, ContextType, RequireFields<GQLMutationCreateStripeTransferArgs, 'currency' | 'receiveCents' | 'receiver' | 'stripeTransferId' | 'stripeTransferObject' | 'withdrawCents'>>;
  createSubscription?: Resolver<Maybe<GQLResolversTypes['Subscribe']>, ParentType, ContextType, RequireFields<GQLMutationCreateSubscriptionArgs, 'app' | 'pricing' | 'subscriber'>>;
  createUsageLog?: Resolver<Maybe<GQLResolversTypes['UsageLog']>, ParentType, ContextType, RequireFields<GQLMutationCreateUsageLogArgs, 'app' | 'path' | 'subscriber' | 'volume'>>;
  createUser?: Resolver<Maybe<GQLResolversTypes['User']>, ParentType, ContextType, RequireFields<GQLMutationCreateUserArgs, 'email'>>;
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
  app?: Resolver<Maybe<GQLResolversTypes['App']>, ParentType, ContextType, Partial<GQLQueryAppArgs>>;
  apps?: Resolver<Maybe<Array<Maybe<GQLResolversTypes['App']>>>, ParentType, ContextType>;
  endpoint?: Resolver<Maybe<GQLResolversTypes['Endpoint']>, ParentType, ContextType, Partial<GQLQueryEndpointArgs>>;
  endpoints?: Resolver<Maybe<Array<Maybe<GQLResolversTypes['Endpoint']>>>, ParentType, ContextType>;
  stripePaymentAccept?: Resolver<Maybe<GQLResolversTypes['StripePaymentAccept']>, ParentType, ContextType, RequireFields<GQLQueryStripePaymentAcceptArgs, 'stripeSessionId'>>;
  subscription?: Resolver<Maybe<GQLResolversTypes['Subscribe']>, ParentType, ContextType, Partial<GQLQuerySubscriptionArgs>>;
  user?: Resolver<Maybe<GQLResolversTypes['User']>, ParentType, ContextType, Partial<GQLQueryUserArgs>>;
  users?: Resolver<Maybe<Array<Maybe<GQLResolversTypes['User']>>>, ParentType, ContextType>;
}>;

export type GQLStripePaymentAcceptResolvers<ContextType = RequestContext, ParentType extends GQLResolversParentTypes['StripePaymentAccept'] = GQLResolversParentTypes['StripePaymentAccept']> = ResolversObject<{
  amountCents?: Resolver<GQLResolversTypes['Int'], ParentType, ContextType>;
  createdAt?: Resolver<GQLResolversTypes['Timestamp'], ParentType, ContextType>;
  currency?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  settlePayment?: Resolver<Maybe<GQLResolversTypes['StripePaymentAccept']>, ParentType, ContextType, RequireFields<GQLStripePaymentAcceptSettlePaymentArgs, 'stripeSessionObject'>>;
  status?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  stripePaymentIntent?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  stripeSessionId?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  stripeSessionObject?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<GQLResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GQLStripeTransferResolvers<ContextType = RequestContext, ParentType extends GQLResolversParentTypes['StripeTransfer'] = GQLResolversParentTypes['StripeTransfer']> = ResolversObject<{
  createdAt?: Resolver<GQLResolversTypes['Timestamp'], ParentType, ContextType>;
  currency?: Resolver<Maybe<GQLResolversTypes['String']>, ParentType, ContextType>;
  newBalance?: Resolver<Maybe<GQLResolversTypes['String']>, ParentType, ContextType>;
  oldBalance?: Resolver<Maybe<GQLResolversTypes['String']>, ParentType, ContextType>;
  receiveCents?: Resolver<GQLResolversTypes['Int'], ParentType, ContextType>;
  receiver?: Resolver<GQLResolversTypes['User'], ParentType, ContextType>;
  settleStripeTransfer?: Resolver<Maybe<GQLResolversTypes['StripeTransfer']>, ParentType, ContextType>;
  stripeTransferId?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  stripeTransferObject?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  withdrawCents?: Resolver<GQLResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GQLSubscribeResolvers<ContextType = RequestContext, ParentType extends GQLResolversParentTypes['Subscribe'] = GQLResolversParentTypes['Subscribe']> = ResolversObject<{
  app?: Resolver<GQLResolversTypes['App'], ParentType, ContextType>;
  createdAt?: Resolver<GQLResolversTypes['Int'], ParentType, ContextType>;
  deleteSubscription?: Resolver<Maybe<GQLResolversTypes['Subscribe']>, ParentType, ContextType>;
  pricing?: Resolver<GQLResolversTypes['Pricing'], ParentType, ContextType>;
  subscriber?: Resolver<GQLResolversTypes['User'], ParentType, ContextType>;
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
  createdAt?: Resolver<GQLResolversTypes['Timestamp'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GQLUserResolvers<ContextType = RequestContext, ParentType extends GQLResolversParentTypes['User'] = GQLResolversParentTypes['User']> = ResolversObject<{
  apps?: Resolver<Maybe<Array<Maybe<GQLResolversTypes['App']>>>, ParentType, ContextType>;
  author?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  balance?: Resolver<Maybe<GQLResolversTypes['String']>, ParentType, ContextType>;
  email?: Resolver<GQLResolversTypes['Email'], ParentType, ContextType>;
  stripeConnectAccountId?: Resolver<Maybe<GQLResolversTypes['String']>, ParentType, ContextType>;
  stripeCustomerId?: Resolver<Maybe<GQLResolversTypes['String']>, ParentType, ContextType>;
  subscriptions?: Resolver<Maybe<Array<Maybe<GQLResolversTypes['Subscribe']>>>, ParentType, ContextType>;
  updateUser?: Resolver<Maybe<GQLResolversTypes['User']>, ParentType, ContextType, Partial<GQLUserUpdateUserArgs>>;
  usageLogs?: Resolver<Maybe<Array<Maybe<GQLResolversTypes['UsageLog']>>>, ParentType, ContextType, RequireFields<GQLUserUsageLogsArgs, 'limit' | 'start'>>;
  usageSummaries?: Resolver<Maybe<Array<Maybe<GQLResolversTypes['UsageSummary']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GQLResolvers<ContextType = RequestContext> = ResolversObject<{
  App?: GQLAppResolvers<ContextType>;
  Date?: GraphQLScalarType;
  Email?: GraphQLScalarType;
  Endpoint?: GQLEndpointResolvers<ContextType>;
  GatewayMode?: GQLGatewayModeResolvers;
  Mutation?: GQLMutationResolvers<ContextType>;
  NonNegativeDecimal?: GraphQLScalarType;
  Pricing?: GQLPricingResolvers<ContextType>;
  Query?: GQLQueryResolvers<ContextType>;
  StripePaymentAccept?: GQLStripePaymentAcceptResolvers<ContextType>;
  StripeTransfer?: GQLStripeTransferResolvers<ContextType>;
  Subscribe?: GQLSubscribeResolvers<ContextType>;
  Timestamp?: GraphQLScalarType;
  UsageLog?: GQLUsageLogResolvers<ContextType>;
  UsageSummary?: GQLUsageSummaryResolvers<ContextType>;
  User?: GQLUserResolvers<ContextType>;
}>;

