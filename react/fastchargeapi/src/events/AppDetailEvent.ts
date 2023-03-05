import { AppEvent, AppEventStream, mapState, to } from "react-appevent-redux";
import { RootAppState } from "../states/RootAppState";
import { getGQLClient } from "../graphql-client";
import { AppContext } from "../AppContext";
import { gql } from "@apollo/client";
import {
    GQLAppDetailLoadAppInfoQuery,
    GQLAppDetailLoadEndpointsQuery,
    GQLAppDetailLoadEndpointsQueryVariables,
    GQLAppDetailLoadPricingsQuery,
} from "../__generated__/gql-operations";

export type AppDetailInfo = GQLAppDetailLoadAppInfoQuery["app"];
class LoadAppInfo extends AppEvent<RootAppState> {
    constructor(
        public context: AppContext,
        public options: { appName: string }
    ) {
        super();
    }
    reducer(state: RootAppState): RootAppState {
        return state.mapState({
            appDetail: mapState({
                loadingAppInfo: to(true),
            }),
        });
    }

    appInfo: AppDetailInfo | null = null;
    async *run(state: RootAppState): AppEventStream<RootAppState> {
        let { client, currentUser } = await getGQLClient(this.context);
        let result = await client.query({
            query: gql`
                query AppDetailLoadAppInfo($appName: String!) {
                    app(name: $appName) {
                        name
                        description
                        repository
                        homepage
                        owner {
                            author
                        }
                    }
                }
            `,
            variables: {
                appName: this.options.appName,
            },
        });
        this.appInfo = result.data.app;
    }

    reduceAfter(state: RootAppState): RootAppState {
        return state.mapState({
            appDetail: mapState({
                loadingAppInfo: to(false),
                appInfo: to(this.appInfo),
            }),
        });
    }
}

export type AppDetailPricing =
    GQLAppDetailLoadPricingsQuery["app"]["pricingPlans"][0];
class LoadPricings extends AppEvent<RootAppState> {
    constructor(
        public context: AppContext,
        public options: { appName: string }
    ) {
        super();
    }
    reducer(state: RootAppState): RootAppState {
        return state.mapState({
            appDetail: mapState({
                loadingPricing: to(true),
            }),
        });
    }

    pricingPlans: AppDetailPricing[] = [];
    async *run(state: RootAppState): AppEventStream<RootAppState> {
        let { client, currentUser } = await getGQLClient(this.context);
        let result = await client.query({
            query: gql`
                query AppDetailLoadPricings($appName: String!) {
                    app(name: $appName) {
                        pricingPlans {
                            name
                            callToAction
                            minMonthlyCharge
                            chargePerRequest
                            freeQuota
                        }
                    }
                }
            `,
            variables: {
                appName: this.options.appName,
            },
        });
        this.pricingPlans = result.data.app.pricingPlans;
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

export type AppDetailEndpoint =
    GQLAppDetailLoadEndpointsQuery["app"]["endpoints"][0];
class LoadEndpoints extends AppEvent<RootAppState> {
    constructor(
        public context: AppContext,
        public options: { appName: string }
    ) {
        super();
    }
    reducer(state: RootAppState): RootAppState {
        return state.mapState({
            appDetail: mapState({
                loadingEndpoints: to(true),
            }),
        });
    }

    endpoints: AppDetailEndpoint[] = [];
    async *run(state: RootAppState): AppEventStream<RootAppState> {
        let { client, currentUser } = await getGQLClient(this.context);
        let result = await client.query<
            GQLAppDetailLoadEndpointsQuery,
            GQLAppDetailLoadEndpointsQueryVariables
        >({
            query: gql`
                query AppDetailLoadEndpoints($appName: String!) {
                    app(name: $appName) {
                        endpoints {
                            method
                            path
                            description
                            destination
                        }
                    }
                }
            `,
            variables: {
                appName: this.options.appName,
            },
        });
        this.endpoints = result.data.app.endpoints;
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
