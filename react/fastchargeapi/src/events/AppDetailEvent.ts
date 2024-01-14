import { AppEvent, AppEventStream, mapState, to } from "react-appevent-redux";
import { AppContext } from "../AppContext";
import { graphql } from "../__generated__/gql";
import {
  AppDetailLoadAppInfoQuery,
  AppDetailLoadEndpointsQuery,
  AppDetailLoadPricingsQuery,
} from "../__generated__/gql/graphql";
import { getGQLClient } from "../graphql-client";
import { RootAppState } from "../states/RootAppState";

export type AppDetailInfo = AppDetailLoadAppInfoQuery["getApp"];
class LoadAppInfo extends AppEvent<RootAppState> {
  constructor(public context: AppContext, public options: { app: string }) {
    super();
  }
  reducer(state: RootAppState): RootAppState {
    return state.mapState({
      appDetail: mapState({
        // loadingAppInfo: to(true),
      }),
    });
  }

  async getReadmeFileContent(url: string): Promise<string> {
    const contentUrl = url.replace(/blob\//, "").replace(/github.com/, "raw.githubusercontent.com");
    const content = await fetch(contentUrl, { method: "GET" });
    return content.text();
  }

  appInfo: AppDetailInfo | null = null;
  appReadmeContent: string | null = null;
  async *run(state: RootAppState): AppEventStream<RootAppState> {
    const { client } = await getGQLClient(this.context);
    const result = await client.query({
      query: graphql(`
        query AppDetailLoadAppInfo($app: ID!) {
          getApp(pk: $app) {
            pk
            title
            name
            description
            repository
            homepage
            readme
            owner {
              author
            }
          }
        }
      `),
      variables: {
        app: this.options.app,
      },
    });
    this.appInfo = result.data.getApp;
    if (this.appInfo?.readme) {
      try {
        this.appReadmeContent = await this.getReadmeFileContent(this.appInfo?.readme);
      } catch (e) {
        console.error(e);
      }
    }
  }

  reduceAfter(state: RootAppState): RootAppState {
    return state.mapState({
      appDetail: mapState({
        loadingAppInfo: to(false),
        appInfo: to(this.appInfo),
        appReadmeContent: to(this.appReadmeContent),
      }),
    });
  }
}

export type AppDetailPricing = AppDetailLoadPricingsQuery["getApp"]["pricingPlans"][0];
class LoadPricings extends AppEvent<RootAppState> {
  constructor(public context: AppContext, public options: { app: string }) {
    super();
  }
  reducer(state: RootAppState): RootAppState {
    return state.mapState({
      appDetail: mapState({
        // loadingPricing: to(true),
      }),
    });
  }

  pricingPlans: AppDetailPricing[] = [];
  async *run(state: RootAppState): AppEventStream<RootAppState> {
    const { client } = await getGQLClient(this.context);
    const result = await client.query({
      query: graphql(`
        query AppDetailLoadPricings($app: ID!) {
          getApp(pk: $app) {
            pricingPlans {
              name
              callToAction
              minMonthlyCharge
              chargePerRequest
              freeQuota
            }
          }
        }
      `),
      variables: {
        app: this.options.app,
      },
    });
    this.pricingPlans = result.data.getApp.pricingPlans;
  }

  reduceAfter(state: RootAppState): RootAppState {
    return state.mapState({
      appDetail: mapState({
        loadingPricing: to(false),
        pricings: to(this.pricingPlans),
      }),
    });
  }
}

export type AppDetailEndpoint = AppDetailLoadEndpointsQuery["getApp"]["endpoints"][0];
class LoadEndpoints extends AppEvent<RootAppState> {
  constructor(public context: AppContext, public options: { app: string }) {
    super();
  }
  reducer(state: RootAppState): RootAppState {
    return state.mapState({
      appDetail: mapState({
        // loadingEndpoints: to(true),
      }),
    });
  }

  endpoints: AppDetailEndpoint[] = [];
  async *run(state: RootAppState): AppEventStream<RootAppState> {
    const { client } = await getGQLClient(this.context);
    const result = await client.query({
      query: graphql(`
        query AppDetailLoadEndpoints($app: ID!) {
          getApp(pk: $app) {
            endpoints {
              method
              path
              description
            }
          }
        }
      `),
      variables: {
        app: this.options.app,
      },
    });
    this.endpoints = result.data.getApp.endpoints;
  }

  reduceAfter(state: RootAppState): RootAppState {
    return state.mapState({
      appDetail: mapState({
        loadingEndpoints: to(false),
        endpoints: to(this.endpoints),
      }),
    });
  }
}

export const AppDetailEvent = {
  LoadAppInfo,
  LoadPricings,
  LoadEndpoints,
};
