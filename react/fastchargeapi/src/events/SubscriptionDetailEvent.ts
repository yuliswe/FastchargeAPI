import {
    AppEvent,
    AppEventStream,
    AppStore,
    mapState,
    to,
} from "react-appevent-redux";
import { RootAppState } from "../states/RootAppState";
import { getGQLClient } from "../graphql-client";
import { AppContext } from "../AppContext";
import { gql } from "@apollo/client";
import {
    GQLGetAvailablePlansQuery,
    GQLGetAvailablePlansQueryVariables,
    GQLGetSubscriptionDetailAppInfoQuery,
    GQLGetSubscriptionDetailAppInfoQueryVariables,
    GQLGetUsageSummaryQuery,
    GQLGetUsageSummaryQueryVariables,
    GQLGetUserSubscriptionDetailQuery,
    GQLGetUserSubscriptionDetailQueryVariables,
} from "../__generated__/gql-operations";
import { SubscriptionDetailAppState } from "../states/SubscriptionDetailAppState";

export type AvailablePlan = GQLGetAvailablePlansQuery["app"]["pricingPlans"][0];

class LoadAvailablePlans extends AppEvent<RootAppState> {
    constructor(
        public context: AppContext,
        public options: { appName: string }
    ) {
        super();
    }
    reducer(state: RootAppState) {
        return state;
    }
    availablePlans: AvailablePlan[] = [];
    async *run(state: RootAppState): AppEventStream<RootAppState> {
        let { client, currentUser } = await getGQLClient(this.context);
        let result = await client.query<
            GQLGetAvailablePlansQuery,
            GQLGetAvailablePlansQueryVariables
        >({
            query: gql`
                query GetAvailablePlans($appName: String!) {
                    app(name: $appName) {
                        pricingPlans {
                            name
                            pk
                            minMonthlyCharge
                            chargePerRequest
                            freeQuota
                            callToAction
                        }
                    }
                }
            `,
            variables: {
                appName: this.options.appName,
            },
        });
        this.availablePlans = result.data.app.pricingPlans;
    }
    reduceAfter(state: RootAppState) {
        return state.mapState({
            subscriptionDetail: mapState<SubscriptionDetailAppState>({
                loadingAvailablePlans: to(false),
                availablePlans: to(this.availablePlans),
            }),
        });
    }
}

export type SubscriptionDetail =
    GQLGetUserSubscriptionDetailQuery["subscription"];

class LoadUserSubscription extends AppEvent<RootAppState> {
    constructor(
        public context: AppContext,
        public options: { appName: string }
    ) {
        super();
    }
    reducer(state: RootAppState) {
        return state;
    }
    subscriptionDetail: SubscriptionDetail | null = null;
    async *run(state: RootAppState): AppEventStream<RootAppState> {
        let { client, currentUser } = await getGQLClient(this.context);
        let result = await client.query<
            GQLGetUserSubscriptionDetailQuery,
            GQLGetUserSubscriptionDetailQueryVariables
        >({
            query: gql`
                query GetUserSubscriptionDetail(
                    $user: Email!
                    $appName: String!
                ) {
                    subscription(subscriber: $user, app: $appName) {
                        pricing {
                            pk
                            name
                        }
                    }
                }
            `,
            variables: {
                appName: this.options.appName,
                user: currentUser,
            },
        });
        this.subscriptionDetail = result.data.subscription;
    }
    reduceAfter(state: RootAppState) {
        return state.mapState({
            subscriptionDetail: mapState<SubscriptionDetailAppState>({
                loadingSubscriptionDetail: to(false),
                subscriptionDetail: to(this.subscriptionDetail),
            }),
        });
    }
}

export type AppInfo = GQLGetSubscriptionDetailAppInfoQuery["app"];
class LoadAppInfo extends AppEvent<RootAppState> {
    constructor(
        public context: AppContext,
        public options: { appName: string }
    ) {
        super();
    }
    reducer(state: RootAppState) {
        return state;
    }

    appInfo: AppInfo | null = null;
    async *run(state: RootAppState): AppEventStream<RootAppState> {
        let { client, currentUser } = await getGQLClient(this.context);
        let result = await client.query<
            GQLGetSubscriptionDetailAppInfoQuery,
            GQLGetSubscriptionDetailAppInfoQueryVariables
        >({
            query: gql`
                query GetSubscriptionDetailAppInfo($appName: String!) {
                    app(name: $appName) {
                        name
                        description
                    }
                }
            `,
            variables: {
                appName: this.options.appName,
            },
        });
        this.appInfo = result.data.app;
    }

    reduceAfter(state: RootAppState) {
        return state.mapState({
            subscriptionDetail: mapState<SubscriptionDetailAppState>({
                appInfo: to(this.appInfo),
            }),
        });
    }
}

export type UsageSummary = GQLGetUsageSummaryQuery["user"]["usageSummaries"][0];

class LoadUsageSummary extends AppEvent<RootAppState> {
    constructor(
        public context: AppContext,
        public options: { appName: string; dateRange: { end: number } }
    ) {
        super();
    }
    reducer(state: RootAppState) {
        return state;
    }

    usageSummary: UsageSummary[] = [];
    async *run(state: RootAppState): AppEventStream<RootAppState> {
        let { client, currentUser } = await getGQLClient(this.context);
        let result = await client.query<
            GQLGetUsageSummaryQuery,
            GQLGetUsageSummaryQueryVariables
        >({
            query: gql`
                query GetUsageSummary(
                    $userEmail: Email!
                    $appName: ID!
                    $dateRange: DateRangeInput
                ) {
                    user(email: $userEmail) {
                        usageSummaries(app: $appName, dateRange: $dateRange) {
                            createdAt
                            volume
                            billingAccountActivity {
                                amount
                            }
                        }
                    }
                }
            `,
            variables: {
                userEmail: currentUser,
                appName: this.options.appName,
                dateRange: this.options.dateRange,
            },
        });
        this.usageSummary = result.data.user.usageSummaries;
    }
    reduceAfter(state: RootAppState) {
        return state.mapState({
            subscriptionDetail: mapState<SubscriptionDetailAppState>({
                loadingUsageSummary: to(false),
                usageSummary: to(this.usageSummary),
            }),
        });
    }
}

export const SubscriotionDetailEvent = {
    LoadAvailablePlans,
    LoadUserSubscription,
    LoadAppInfo,
    LoadUsageSummary,
};
