import { AppEvent, AppEventStream, mapState, to } from "react-appevent-redux";
import { AppContext } from "../AppContext";
import { graphql } from "../__generated__/gql";
import { GetAccountActivitiesQuery, GetAccountHistoriesQuery, GetAccountInfoQuery } from "../__generated__/gql/graphql";
import { fetchWithAuth } from "../fetch";
import { getGQLClient } from "../graphql-client";
import { paymentServiceBaseURL } from "../runtime";
import { RootAppState } from "../states/RootAppState";

export type UserAccountInfo = GetAccountInfoQuery["getUser"];
class LoadUserInfo extends AppEvent<RootAppState> {
  constructor(public context: AppContext) {
    super();
  }
  reducer(state: RootAppState): RootAppState {
    return state.mapState({
      dashboard: mapState({
        loadingBalance: to(true),
      }),
    });
  }

  accountInfo: UserAccountInfo | null = null;
  async *run(state: RootAppState): AppEventStream<RootAppState> {
    const { client, currentUser } = await getGQLClient(this.context);
    const result = await client.query({
      query: graphql(`
        query GetAccountInfo($user: ID!) {
          getUser(pk: $user) {
            email
            balance
            author
          }
        }
      `),
      variables: {
        user: currentUser!,
      },
    });
    this.accountInfo = result.data.getUser;
  }

  reduceAfter(state: RootAppState): RootAppState {
    return state.mapState({
      dashboard: mapState({
        loadingBalance: to(false),
        userAccountInfo: to(this.accountInfo),
      }),
    });
  }
}

export type AccountActivity = GetAccountActivitiesQuery["getUser"]["accountActivities"][0];
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
    const { client, currentUser } = await getGQLClient(this.context);
    const result = await client.query({
      query: graphql(`
        query GetAccountActivities($user: ID!, $dateRange: DateRangeInput!) {
          getUser(pk: $user) {
            accountActivities(dateRange: $dateRange, limit: 200) {
              createdAt
              type
              amount
              reason
              description
              status
              settleAt
              consumedFreeQuota
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
      `),
      variables: {
        user: currentUser!,
        dateRange: {
          end: this.options.beforeDate,
        },
      },
    });
    this.activities = result.data.getUser.accountActivities;
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

export type AccountHistory = GetAccountHistoriesQuery["getUser"]["accountHistories"][0];

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
    const { client, currentUser } = await getGQLClient(this.context);
    const result = await client.query({
      query: graphql(`
        query GetAccountHistories($user: ID!, $dateRange: DateRangeInput!) {
          getUser(pk: $user) {
            accountHistories(dateRange: $dateRange, limit: 200) {
              closingBalance
              closingTime
            }
          }
        }
      `),
      variables: {
        user: currentUser!,
        dateRange: {
          end: this.options.beforeDate,
        },
      },
    });
    this.accountHistories = result.data.getUser.accountHistories;
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
    return state.mapState({
      dashboard: mapState({
        loadingStripeLoginLink: to(true),
      }),
    });
  }

  async *run(state: RootAppState): AppEventStream<RootAppState> {
    await fetchWithAuth(this.context, `${paymentServiceBaseURL}/send-stripe-login-link`, {
      method: "POST",
    });
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
  LoadUserInfo,
  LoadActivities,
  LoadAccountHistory,
  SendStripeLoginLink,
  StripeLinkReady,
};
