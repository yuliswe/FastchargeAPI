import { AppEvent, AppEventStream, mapState, to } from "react-appevent-redux";
import { paymentServiceBaseURL } from "src/env";
import { AppContext } from "src/AppContext";
import { graphql } from "src/__generated__/gql";
import {
  DashboardAccountActivityFragment,
  DashboardAccountHistoryFragment,
  GetAccountInfoQuery,
} from "src/__generated__/gql/graphql";
import { fetchWithAuth } from "src/fetch";
import { getGQLClient } from "src/graphql-client";
import { RootAppState } from "src/states/RootAppState";

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

  activities: DashboardAccountActivityFragment[] = [];

  async *run(state: RootAppState): AppEventStream<RootAppState> {
    const { client, currentUser } = await getGQLClient(this.context);
    const result = await client.query({
      query: graphql(`
        query GetAccountActivities($user: ID!, $dateRange: DateRangeInput!) {
          listAccountActivitiesByUser(user: $user, dateRange: $dateRange, limit: 200) {
            ...DashboardAccountActivity
          }
        }
        fragment DashboardAccountActivity on AccountActivity {
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
      `),
      variables: {
        user: currentUser!,
        dateRange: {
          end: this.options.beforeDate,
        },
      },
    });

    this.activities = result.data.listAccountActivitiesByUser;
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

  accountHistories: DashboardAccountHistoryFragment[] = [];
  async *run(state: RootAppState): AppEventStream<RootAppState> {
    const { client, currentUser } = await getGQLClient(this.context);
    const result = await client.query({
      query: graphql(`
        query GetAccountHistories($user: ID!, $dateRange: DateRangeInput!) {
          listAccountHistoryByUser(user: $user, dateRange: $dateRange, limit: 200) {
            ...DashboardAccountHistory
          }
        }
        fragment DashboardAccountHistory on AccountHistory {
          closingBalance
          closingTime
        }
      `),
      variables: {
        user: currentUser!,
        dateRange: {
          end: this.options.beforeDate,
        },
      },
    });
    this.accountHistories = result.data.listAccountHistoryByUser;
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
