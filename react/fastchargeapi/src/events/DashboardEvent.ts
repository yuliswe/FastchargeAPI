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
        let result = await client.query<
            GQLGetAccountBalanceQuery,
            GQLGetAccountBalanceQueryVariables
        >({
            query: gql`
                query GetAccountBalance($email: Email!) {
                    user(email: $email) {
                        balance
                    }
                }
            `,
            variables: {
                email: currentUser,
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

export type AccountActivity =
    GQLGetAccountActivitiesQuery["user"]["accountActivities"][0];
class LoadActivities extends AppEvent<RootAppState> {
    constructor(
        public context: AppContext,
        public options: { beforeDate: number }
    ) {
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
        let result = await client.query<
            GQLGetAccountActivitiesQuery,
            GQLGetAccountActivitiesQueryVariables
        >({
            query: gql`
                query GetAccountActivities(
                    $email: Email!
                    $dateRange: DateRangeInput!
                ) {
                    user(email: $email) {
                        accountActivities(dateRange: $dateRange, limit: 1000) {
                            createdAt
                            type
                            amount
                            reason
                            description
                        }
                    }
                }
            `,
            variables: {
                email: currentUser,
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

export type AccountHistory =
    GQLGetAccountHistoriesQuery["user"]["accountHistories"][0];

class LoadAccountHistory extends AppEvent<RootAppState> {
    constructor(
        public context: AppContext,
        public options: { beforeDate: number }
    ) {
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
        let result = await client.query<
            GQLGetAccountHistoriesQuery,
            GQLGetAccountHistoriesQueryVariables
        >({
            query: gql`
                query GetAccountHistories(
                    $email: Email!
                    $dateRange: DateRangeInput!
                ) {
                    user(email: $email) {
                        accountHistories(dateRange: $dateRange, limit: 1000) {
                            closingBalance
                            closingTime
                        }
                    }
                }
            `,
            variables: {
                email: currentUser,
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
export const DashboardEvent = {
    LoadAccontBalance,
    LoadActivities,
    LoadAccountHistory,
};
