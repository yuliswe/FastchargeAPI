import { AppEvent, AppEventStream, mapState, to } from "react-appevent-redux";
import { RootAppState } from "../states/RootAppState";
import { AppContext } from "../AppContext";
import { getGQLClient } from "../graphql-client";
import { gql } from "@apollo/client";
import { GQLMyAppGetDetailQuery, GQLMyAppGetDetailQueryVariables } from "../__generated__/gql-operations";

export type MyAppDetail = GQLMyAppGetDetailQuery["app"];

class LoadAppInfo extends AppEvent<RootAppState> {
    constructor(public readonly context: AppContext, public options: { appName: string }) {
        super();
    }
    reducer(state: RootAppState): RootAppState {
        return state;
    }

    appDetail: MyAppDetail | null = null;
    async *run(state: RootAppState): AppEventStream<RootAppState> {
        const { client, currentUser } = await getGQLClient(this.context);
        const result = await client.query<GQLMyAppGetDetailQuery, GQLMyAppGetDetailQueryVariables>({
            query: gql(`
                    query MyAppGetDetail($appName: String!) {
                        app(name: $appName) {
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
        this.appDetail = result.data.app;
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
