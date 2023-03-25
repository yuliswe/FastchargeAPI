import { AppEvent, AppEventStream, mapState, to } from "react-appevent-redux";
import { RootAppState } from "../states/RootAppState";
import { getGQLClient } from "../graphql-client";
import { AppContext } from "../AppContext";
import { gql } from "graphql-tag";
import {
    GQLGetAccountBalanceQuery,
    GQLGetAccountBalanceQueryVariables,
    GQLGetAccountActivitiesQuery,
    GQLGetAccountActivitiesQueryVariables,
    GQLGetAccountHistoriesQuery,
    GQLGetAccountHistoriesQueryVariables,
} from "../__generated__/gql-operations";
import { fetchWithAuth } from "../fetch";

class LoadAccontBalance extends AppEvent<RootAppState> {
    constructor(public context: AppContext) {
        super();
    }
    reducer(state: RootAppState): RootAppState {
        return state.mapState({
            dashboard: mapState({
                loadingBalance: to(true),
                accountBalance: to("Loading..."),
            }),
        });
    }

    public response: GQLGetAccountBalanceQuery | null = null;
    async *run(state: RootAppState): AppEventStream<RootAppState> {
        let { client, currentUser } = await getGQLClient(this.context);
        let result = await client.query<GQLGetAccountBalanceQuery, GQLGetAccountBalanceQueryVariables>({
            query: gql`
                query GetAccountBalance($user: ID!) {
                    user(pk: $user) {
                        balance
                    }
                }
            `,
            variables: {
                user: currentUser!,
            },
        });
        this.response = result.data;
    }

    reduceAfter(state: RootAppState): RootAppState {
        return state.mapState({
            dashboard: mapState({
                loadingBalance: to(false),
                accountBalance: to(this.response?.user?.balance || "Error"),
            }),
        });
    }
}

export type AccountActivity = GQLGetAccountActivitiesQuery["user"]["accountActivities"][0];
class LoadActivities extends AppEvent<RootAppState> {
    constructor(public context: AppContext, public options: { beforeDate: number }) {
        super();
    }

    reducer(state: RootAppState): RootAppState {
        return state.mapState({
            dashboard: mapState({
                loadingActivities: to(true),
            }),
        });
    }

    activities: AccountActivity[] = [];

    async *run(state: RootAppState): AppEventStream<RootAppState> {
        let { client, currentUser } = await getGQLClient(this.context);
        let result = await client.query<GQLGetAccountActivitiesQuery, GQLGetAccountActivitiesQueryVariables>({
            query: gql`
                query GetAccountActivities($user: ID!, $dateRange: DateRangeInput!) {
                    user(pk: $user) {
                        accountActivities(dateRange: $dateRange, limit: 1000) {
                            createdAt
                            type
                            amount
                            reason
                            description
                            status
                            settleAt
                            billedApp {
                                name
                            }
                            usageSummary {
                                volume
                            }
                            stripeTransfer {
                                transferAt
                                status
                            }
                        }
                    }
                }
            `,
            variables: {
                user: currentUser!,
                dateRange: {
                    end: this.options.beforeDate,
                },
            },
        });
        this.activities = result.data.user.accountActivities;
    }

    reduceAfter(state: RootAppState): RootAppState {
        return state.mapState({
            dashboard: mapState({
                loadingActivities: to(false),
                activities: to(this.activities),
            }),
        });
    }
}

export type AccountHistory = GQLGetAccountHistoriesQuery["user"]["accountHistories"][0];

class LoadAccountHistory extends AppEvent<RootAppState> {
    constructor(public context: AppContext, public options: { beforeDate: number }) {
        super();
    }

    reducer(state: RootAppState): RootAppState {
        return state.mapState({
            dashboard: mapState({
                loadingActivities: to(true),
            }),
        });
    }

    accountHistories: AccountHistory[] = [];
    async *run(state: RootAppState): AppEventStream<RootAppState> {
        let { client, currentUser } = await getGQLClient(this.context);
        let result = await client.query<GQLGetAccountHistoriesQuery, GQLGetAccountHistoriesQueryVariables>({
            query: gql`
                query GetAccountHistories($user: ID!, $dateRange: DateRangeInput!) {
                    user(pk: $user) {
                        accountHistories(dateRange: $dateRange, limit: 1000) {
                            closingBalance
                            closingTime
                        }
                    }
                }
            `,
            variables: {
                user: currentUser!,
                dateRange: {
                    end: this.options.beforeDate,
                },
            },
        });
        this.accountHistories = result.data.user.accountHistories;
    }

    reduceAfter(state: RootAppState): RootAppState {
        return state.mapState({
            dashboard: mapState({
                loadingActivities: to(false),
                accountHistories: to(this.accountHistories),
            }),
        });
    }
}

class SendStripeLoginLink extends AppEvent<RootAppState> {
    constructor(public context: AppContext) {
        super();
    }

    reducer(state: RootAppState): RootAppState {
        let res!: (value: string) => void;
        let linkPromise = new Promise<string>((resolve, reject) => {
            res = resolve;
        });
        return state.mapState({
            dashboard: mapState({
                loadingStripeLoginLink: to(true),
            }),
        });
    }

    async *run(state: RootAppState): AppEventStream<RootAppState> {
        let result = await fetchWithAuth(
            this.context,
            "https://api.v2.payment.fastchargeapi.com/send-stripe-login-link",
            {
                method: "POST",
            }
        );
        yield new StripeLinkReady(this.context);
    }

    reduceAfter(state: RootAppState): RootAppState {
        return state.mapState({
            dashboard: mapState({
                loadingStripeLoginLink: to(false),
            }),
        });
    }
}

class StripeLinkReady extends AppEvent<RootAppState> {
    constructor(public context: AppContext) {
        super();
    }
    reducer(state: RootAppState): RootAppState {
        return state.mapState({
            dashboard: mapState({
                loadingStripeLoginLink: to(false),
            }),
        });
    }
    async *run(state: RootAppState): AppEventStream<RootAppState> {
        // nothing
    }
}

export const DashboardEvent = {
    LoadAccontBalance,
    LoadActivities,
    LoadAccountHistory,
    SendStripeLoginLink,
    StripeLinkReady,
};
