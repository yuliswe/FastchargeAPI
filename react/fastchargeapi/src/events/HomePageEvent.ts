import { AppEvent, AppEventStream, mapState, to } from "react-appevent-redux";
import { AppContext } from "../AppContext";
import { graphql } from "../__generated__/gql";
import {
  GetFeaturedProductsQuery,
  HomePageGetLatestProductsQuery,
  SiteMetaDataKey,
} from "../__generated__/gql/graphql";
import { GetQueryResult, getGQLClient } from "../graphql-client";
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

export type HomePageFeaturedProduct = GetFeaturedProductsQuery["listAppsByTag"][0] & { tags?: string[] };
class LoadFeaturedProducts extends AppEvent<RootAppState> {
  constructor(private context: AppContext) {
    super();
  }
  reducer(state: RootAppState): RootAppState {
    return state;
  }

  getFeaturedProductsQuery = graphql(`
    query GetFeaturedProducts {
      listAppsByTag(tag: "Featured") {
        pk
        name
        logo
        title
        description
      }
    }
  `);

  featuredProducts: GetQueryResult<typeof this.getFeaturedProductsQuery> | null = null;

  async *run(state: RootAppState): AppEventStream<RootAppState> {
    const { client } = await getGQLClient(this.context);
    const result = await client.query({
      query: this.getFeaturedProductsQuery,
    });
    this.featuredProducts = result.data;
  }

  reduceAfter(state: RootAppState): RootAppState {
    return state.mapState({
      home: mapState({
        featuredProducts: to(
          this.featuredProducts!.listAppsByTag.map(({ pk, name, title, logo, description }) => ({
            pk,
            logo: logo || "",
            title: title || name,
            description: description || "",
            link: RouteURL.appDetailPage({ params: { app: name } }),
            tags: ["Featured"],
          }))
        ),
        loadingFeaturedProducts: to(false),
      }),
    });
  }
}

export type HomePageLatestProduct = HomePageGetLatestProductsQuery["listAppsByTag"][0] & { tags?: string[] };
class LoadLatestProducts extends AppEvent<RootAppState> {
  constructor(private context: AppContext) {
    super();
  }

  reducer(state: RootAppState): RootAppState {
    return state;
  }

  getLatestProductsQuery = graphql(`
    query HomePageGetLatestProducts {
      listAppsByTag(tag: "Latest") {
        pk
        name
        logo
        title
        description
      }
    }
  `);

  latestProducts: GetQueryResult<typeof this.getLatestProductsQuery> | null = null;

  async *run(state: RootAppState): AppEventStream<RootAppState> {
    const { client } = await getGQLClient(this.context);
    const result = await client.query({
      query: this.getLatestProductsQuery,
    });
    this.latestProducts = result.data;
  }

  reduceAfter(state: RootAppState): RootAppState {
    return state.mapState({
      home: mapState({
        latestProducts: to(
          this.latestProducts!.listAppsByTag.map(({ pk, name, logo, title, description }) => ({
            pk,
            logo: logo || "",
            title: title || name,
            description: description || "",
            link: RouteURL.appDetailPage({ params: { app: name } }),
            tags: ["Latest"],
          }))
        ),
        loadingLatestProducts: to(false),
      }),
    });
  }
}

class LoadPricingData extends AppEvent<RootAppState> {
  constructor(private context: AppContext) {
    super();
  }
  reducer(state: RootAppState): RootAppState {
    return state;
  }

  queryPricingdata = graphql(`
    query HomePageGetPricingData(
      $per_request_charge: String!
      $stripe_flat_fee: String!
      $stripe_percentage_fee: String!
    ) {
      per_request_charge: getSiteMetaDataByKey(key: $per_request_charge) {
        key
        value
      }
      stripe_flat_fee: getSiteMetaDataByKey(key: $stripe_flat_fee) {
        key
        value
      }
      stripe_percentage_fee: getSiteMetaDataByKey(key: $stripe_percentage_fee) {
        key
        value
      }
    }
  `);

  pricingData: GetQueryResult<typeof this.queryPricingdata> | null = null;

  async *run(state: RootAppState): AppEventStream<RootAppState> {
    const { client } = await getGQLClient(this.context);
    const result = await client.query({
      query: this.queryPricingdata,
      variables: {
        per_request_charge: SiteMetaDataKey.PerRequestCharge,
        stripe_flat_fee: SiteMetaDataKey.StripeFlatFee,
        stripe_percentage_fee: SiteMetaDataKey.StripePercentageFee,
      },
    });
    this.pricingData = result.data;
  }

  reduceAfter(state: RootAppState): RootAppState {
    return state.mapState({
      home: mapState({
        loadingPricingData: to(false),
        pricingPerRequest: to(this.pricingData?.per_request_charge?.value || ""),
        pricingStripeFlatFee: to(this.pricingData?.stripe_flat_fee?.value || ""),
        pricingStripePercentageFee: to(this.pricingData?.stripe_percentage_fee?.value || ""),
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
