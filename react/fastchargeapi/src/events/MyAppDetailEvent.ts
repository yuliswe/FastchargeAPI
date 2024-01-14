import { AppEvent, AppEventStream, mapState, to } from "react-appevent-redux";
import { AppContext } from "../AppContext";
import { graphql } from "../__generated__/gql";
import { MyAppGetDetailQuery } from "../__generated__/gql/graphql";
import { getGQLClient } from "../graphql-client";
import { RootAppState } from "../states/RootAppState";

export type MyAppDetail = MyAppGetDetailQuery["getAppByName"];

class LoadAppInfo extends AppEvent<RootAppState> {
  constructor(public readonly context: AppContext, public options: { appName: string }) {
    super();
  }
  reducer(state: RootAppState): RootAppState {
    return state;
  }

  appDetail: MyAppDetail | null = null;
  async *run(state: RootAppState): AppEventStream<RootAppState> {
    const { client } = await getGQLClient(this.context);
    const result = await client.query({
      query: graphql(`
        query MyAppGetDetail($appName: String!) {
          getAppByName(name: $appName) {
            name
            title
            description
            repository
            homepage
            readme
            visibility
            pricingPlans {
              pk
              name
              minMonthlyCharge
              chargePerRequest
              freeQuota
              callToAction
            }
            endpoints {
              pk
              path
              description
              destination
              method
            }
          }
        }
      `),
      variables: {
        appName: this.options.appName,
      },
    });
    this.appDetail = result.data.getAppByName;
  }

  reduceAfter(state: RootAppState): RootAppState {
    return state.mapState({
      myAppDetail: mapState({
        appDetail: to(this.appDetail),
        loadingAppDetail: to(false),
      }),
    });
  }
}

export const MyAppDetailEvent = {
  LoadAppInfo,
};
