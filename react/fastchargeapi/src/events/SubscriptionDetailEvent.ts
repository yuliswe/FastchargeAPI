import { AppEvent, AppEventStream, mapState, to } from "react-appevent-redux";
import { AppContext } from "src/AppContext";
import { graphql } from "src/__generated__/gql";
import {
  GetAvailablePlansQuery,
  GetSubscriptionDetailAppInfoQuery,
  GetUsageSummaryQuery,
  GetUserSubscriptionDetailQuery,
} from "src/__generated__/gql/graphql";
import { getGQLClient } from "src/graphql-client";
import { RootAppState } from "src/states/RootAppState";
import { SubscriptionDetailAppState } from "src/states/SubscriptionDetailAppState";

export type AvailablePlan = GetAvailablePlansQuery["getAppByName"]["pricingPlans"][0];

class LoadAvailablePlans extends AppEvent<RootAppState> {
  constructor(public context: AppContext, public options: { appName: string }) {
    super();
  }
  reducer(state: RootAppState) {
    return state;
  }

  availablePlans: AvailablePlan[] = [];

  async *run(state: RootAppState): AppEventStream<RootAppState> {
    const { client } = await getGQLClient(this.context);
    const result = await client.query({
      query: graphql(`
        query GetAvailablePlans($appName: String!) {
          getAppByName(name: $appName) {
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
      `),
      variables: {
        appName: this.options.appName,
      },
    });
    this.availablePlans = result.data.getAppByName.pricingPlans;
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

export type SubscriptionDetail = GetUserSubscriptionDetailQuery["getSubscriptionByAppSubscriber"];

class LoadUserSubscription extends AppEvent<RootAppState> {
  constructor(public context: AppContext, public options: { appName: string }) {
    super();
  }
  reducer(state: RootAppState) {
    return state;
  }
  subscriptionDetail: SubscriptionDetail | null = null;
  async *run(state: RootAppState): AppEventStream<RootAppState> {
    const { client, currentUser } = await getGQLClient(this.context);
    const result = await client.query({
      query: graphql(`
        query GetUserSubscriptionDetail($user: ID!, $appName: ID!) {
          getSubscriptionByAppSubscriber(subscriber: $user, app: $appName) {
            pricing {
              pk
              name
            }
          }
        }
      `),
      variables: {
        appName: this.options.appName,
        user: currentUser!,
      },
    });
    this.subscriptionDetail = result.data.getSubscriptionByAppSubscriber;
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

export type AppInfo = GetSubscriptionDetailAppInfoQuery["getAppByName"];
class LoadAppInfo extends AppEvent<RootAppState> {
  constructor(public context: AppContext, public options: { appName: string }) {
    super();
  }
  reducer(state: RootAppState) {
    return state;
  }

  appInfo: AppInfo | null = null;
  async *run(state: RootAppState): AppEventStream<RootAppState> {
    const { client } = await getGQLClient(this.context);
    const result = await client.query({
      query: graphql(`
        query GetSubscriptionDetailAppInfo($appName: String!) {
          getAppByName(name: $appName) {
            name
            title
            description
          }
        }
      `),
      variables: {
        appName: this.options.appName,
      },
    });
    this.appInfo = result.data.getAppByName;
  }

  reduceAfter(state: RootAppState) {
    return state.mapState({
      subscriptionDetail: mapState<SubscriptionDetailAppState>({
        appInfo: to(this.appInfo),
      }),
    });
  }
}

export type UsageSummary = GetUsageSummaryQuery["getUser"]["usageSummaries"][0];

class LoadUsageSummary extends AppEvent<RootAppState> {
  constructor(public context: AppContext, public options: { appName: string; dateRange: { end: number } }) {
    super();
  }
  reducer(state: RootAppState) {
    return state;
  }

  usageSummary: UsageSummary[] = [];
  async *run(state: RootAppState): AppEventStream<RootAppState> {
    const { client, currentUser } = await getGQLClient(this.context);
    const result = await client.query({
      query: graphql(`
        query GetUsageSummary($user: ID!, $appName: ID!, $dateRange: DateRangeInput) {
          getUser(pk: $user) {
            usageSummaries(app: $appName, dateRange: $dateRange) {
              createdAt
              volume
              billingRequestChargeAccountActivity {
                amount
              }
            }
          }
        }
      `),
      variables: {
        user: currentUser!,
        appName: this.options.appName,
        dateRange: this.options.dateRange,
      },
    });
    this.usageSummary = result.data.getUser.usageSummaries;
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
