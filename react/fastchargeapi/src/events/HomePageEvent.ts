import { gql } from "@apollo/client";
import { AppEvent, AppEventStream, mapState, to } from "react-appevent-redux";
import { AppContext } from "../AppContext";
import {
    GQLGetFeaturedProductsQuery,
    GQLGetFeaturedProductsQueryVariables,
    GQLHomePageGetLatestProductsQuery,
    GQLHomePageGetLatestProductsQueryVariables,
    GQLHomePageGetPricingDataQuery,
    GQLHomePageGetPricingDataQueryVariables,
    GQLSiteMetaDataKey,
} from "../__generated__/gql-operations";
import { getGQLClient } from "../graphql-client";
import { RouteURL } from "../routes";
import { RootAppState } from "../states/RootAppState";

class LoadCategories extends AppEvent<RootAppState> {
    constructor(private context: AppContext) {
        super();
    }
    reducer(state: RootAppState): RootAppState {
        return state;
    }
    async *run(state: RootAppState): AppEventStream<RootAppState> {
        // todo
    }
    reduceAfter(state: RootAppState): RootAppState {
        return state.mapState({
            home: mapState({
                categories: to([
                    {
                        title: "Development",
                        description: "APIs for code development uploaded by other developers.",
                        tag: "Development",
                    },
                ]),
            }),
        });
    }
}

export type HomePageFeaturedProduct = GQLGetFeaturedProductsQuery["apps"][0] & { tags?: string[] };
class LoadFeaturedProducts extends AppEvent<RootAppState> {
    constructor(private context: AppContext) {
        super();
    }
    reducer(state: RootAppState): RootAppState {
        return state;
    }

    featuredProducts: HomePageFeaturedProduct[] | null = null;
    async *run(state: RootAppState): AppEventStream<RootAppState> {
        const { client, currentUser } = await getGQLClient(this.context);
        const result = await client.query<GQLGetFeaturedProductsQuery, GQLGetFeaturedProductsQueryVariables>({
            query: gql`
                query GetFeaturedProducts {
                    apps(tag: "Featured") {
                        name
                        logo
                        title
                        description
                    }
                }
            `,
        });
        this.featuredProducts = result.data.apps;
    }
    reduceAfter(state: RootAppState): RootAppState {
        return state.mapState({
            home: mapState({
                featuredProducts: to(
                    this.featuredProducts!.map((app) => ({
                        pk: app.name,
                        logo: app.logo || "",
                        title: app.title || app.name,
                        description: app.description || "",
                        link: RouteURL.appDetailPage({ params: { app: app.name } }),
                        tags: ["Featured"],
                    }))
                ),
                loadingFeaturedProducts: to(false),
            }),
        });
    }
}

export type HomePageLatestProduct = GQLHomePageGetLatestProductsQuery["apps"][0] & { tags?: string[] };
class LoadLatestProducts extends AppEvent<RootAppState> {
    constructor(private context: AppContext) {
        super();
    }
    reducer(state: RootAppState): RootAppState {
        return state;
    }
    latestProducts: HomePageFeaturedProduct[] | null = null;
    async *run(state: RootAppState): AppEventStream<RootAppState> {
        const { client, currentUser } = await getGQLClient(this.context);
        const result = await client.query<
            GQLHomePageGetLatestProductsQuery,
            GQLHomePageGetLatestProductsQueryVariables
        >({
            query: gql`
                query HomePageGetLatestProducts {
                    apps(tag: "Latest") {
                        name
                        logo
                        title
                        description
                    }
                }
            `,
        });
        this.latestProducts = result.data.apps;
    }
    reduceAfter(state: RootAppState): RootAppState {
        return state.mapState({
            home: mapState({
                latestProducts: to(
                    this.latestProducts!.map((app) => ({
                        pk: app.name,
                        logo: app.logo || "",
                        title: app.title || app.name,
                        description: app.description || "",
                        link: RouteURL.appDetailPage({ params: { app: app.name } }),
                        tags: ["Latest"],
                    }))
                ),
                loadingLatestProducts: to(false),
            }),
        });
    }
}

type HomePagePricingData = Map<GQLSiteMetaDataKey, string>;
class LoadPricingData extends AppEvent<RootAppState> {
    constructor(private context: AppContext) {
        super();
    }
    reducer(state: RootAppState): RootAppState {
        return state;
    }

    pricingData: HomePagePricingData | null = null;
    async *run(state: RootAppState): AppEventStream<RootAppState> {
        const { client, currentUser } = await getGQLClient(this.context);
        const result = await client.query<GQLHomePageGetPricingDataQuery, GQLHomePageGetPricingDataQueryVariables>({
            query: gql`
                query HomePageGetPricingData {
                    siteMetaData(keys: [pricingPerRequestCharge, pricingStripeFlatFee, pricingStripePercentageFee]) {
                        key
                        value
                    }
                }
            `,
        });
        this.pricingData = new Map(result.data.siteMetaData.map((x) => [x.key, x.value]));
    }

    reduceAfter(state: RootAppState): RootAppState {
        return state.mapState({
            home: mapState({
                loadingPricingData: to(false),
                pricingPerRequest: to(this.pricingData!.get(GQLSiteMetaDataKey.PricingPerRequestCharge) as string),
                pricingStripeFlatFee: to(this.pricingData!.get(GQLSiteMetaDataKey.PricingStripeFlatFee) as string),
                pricingStripePercentageFee: to(
                    this.pricingData!.get(GQLSiteMetaDataKey.PricingStripePercentageFee) as string
                ),
            }),
        });
    }
}

export const HomePageEvent = {
    LoadFeaturedProducts,
    LoadLatestProducts,
    LoadCategories,
    LoadPricingData,
};
