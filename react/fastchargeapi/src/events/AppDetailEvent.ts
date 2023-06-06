import { gql } from "@apollo/client";
import { AppEvent, AppEventStream, mapState, to } from "react-appevent-redux";
import { AppContext } from "../AppContext";
import {
    GQLAppDetailLoadAppInfoQuery,
    GQLAppDetailLoadEndpointsQuery,
    GQLAppDetailLoadEndpointsQueryVariables,
    GQLAppDetailLoadPricingsQuery,
} from "../__generated__/gql-operations";
import { getGQLClient } from "../graphql-client";
import { RootAppState } from "../states/RootAppState";

export type AppDetailInfo = GQLAppDetailLoadAppInfoQuery["app"];
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
        let contentUrl = url.replace(/blob\//, "").replace(/github.com/, "raw.githubusercontent.com");
        let content = await fetch(contentUrl, { method: "GET" });
        return content.text();
    }

    appInfo: AppDetailInfo | null = null;
    appReadmeContent: string | null = null;
    async *run(state: RootAppState): AppEventStream<RootAppState> {
        let { client, currentUser } = await getGQLClient(this.context);
        let result = await client.query({
            query: gql`
                query AppDetailLoadAppInfo($app: ID!) {
                    app(pk: $app) {
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
            `,
            variables: {
                app: this.options.app,
            },
        });
        this.appInfo = result.data.app;
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

export type AppDetailPricing = GQLAppDetailLoadPricingsQuery["app"]["pricingPlans"][0];
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
        let { client, currentUser } = await getGQLClient(this.context);
        let result = await client.query({
            query: gql`
                query AppDetailLoadPricings($app: ID!) {
                    app(pk: $app) {
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
                app: this.options.app,
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

export type AppDetailEndpoint = GQLAppDetailLoadEndpointsQuery["app"]["endpoints"][0];
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
        let { client, currentUser } = await getGQLClient(this.context);
        let result = await client.query<GQLAppDetailLoadEndpointsQuery, GQLAppDetailLoadEndpointsQueryVariables>({
            query: gql`
                query AppDetailLoadEndpoints($app: ID!) {
                    app(pk: $app) {
                        endpoints {
                            method
                            path
                            description
                        }
                    }
                }
            `,
            variables: {
                app: this.options.app,
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
