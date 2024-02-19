import { AppEvent, AppEventStream, mapState, to } from "react-appevent-redux";
import { AppContext } from "../AppContext";
import { graphql } from "../__generated__/gql";
import {
  FeaturedProductFragment,
  GetFeaturedProductsQuery,
  HomePageGetLatestProductsQuery,
  LatestProductFragment,
  SiteMetaDataKey,
} from "../__generated__/gql/graphql";
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

export type HomePageFeaturedProduct = GetFeaturedProductsQuery["listAppsByTag"][0] & { tags?: string[] };
class LoadFeaturedProducts extends AppEvent<RootAppState> {
  constructor(private context: AppContext) {
    super();
  }

  reducer(state: RootAppState): RootAppState {
    return state;
  }

  featuredProducts: FeaturedProductFragment[] = [];

  async *run(state: RootAppState): AppEventStream<RootAppState> {
    const { client } = await getGQLClient(this.context);
    const result = await client.query({
      query: graphql(`
        query GetFeaturedProducts {
          listAppsByTag(tag: "Featured") {
            ...FeaturedProduct
          }
        }

        fragment FeaturedProduct on App {
          pk
          name
          logo
          title
          description
        }
      `),
    });

    this.featuredProducts = result.data.listAppsByTag;
  }

  reduceAfter(state: RootAppState): RootAppState {
    return state.mapState({
      home: mapState({
        featuredProducts: to(
          this.featuredProducts.map(({ pk, logo, title, description, name }) => ({
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

  latestProducts: LatestProductFragment[] = [];

  async *run(state: RootAppState): AppEventStream<RootAppState> {
    const { client } = await getGQLClient(this.context);
    const result = await client.query({
      query: graphql(`
        query HomePageGetLatestProducts {
          listAppsByTag(tag: "Latest") {
            ...LatestProduct
          }
        }

        fragment LatestProduct on App {
          pk
          name
          logo
          title
          description
        }
      `),
    });

    this.latestProducts = result.data.listAppsByTag;
  }

  reduceAfter(state: RootAppState): RootAppState {
    return state.mapState({
      home: mapState({
        latestProducts: to(
          this.latestProducts.map(({ pk, name, logo, title, description }) => ({
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

  pricingData: {
    perRequestCharge: string;
    stripeFlatFee: string;
    stripePercentageFee: string;
  } | null = null;

  async *run(state: RootAppState): AppEventStream<RootAppState> {
    const { client } = await getGQLClient(this.context);
    const result = await client.query({
      query: graphql(`
        query HomePageGetPricingData(
          $perRequestChargeKey: String!
          $stripeFlatFeeKey: String!
          $stripePercentageFeeKey: String!
        ) {
          preRequestCharge: getSiteMetaDataByKey(key: $perRequestChargeKey) {
            key
            value
          }
          stripeFlatFee: getSiteMetaDataByKey(key: $stripeFlatFeeKey) {
            key
            value
          }
          stripePercentageFee: getSiteMetaDataByKey(key: $stripePercentageFeeKey) {
            key
            value
          }
        }
      `),
      variables: {
        perRequestChargeKey: SiteMetaDataKey.PerRequestCharge,
        stripeFlatFeeKey: SiteMetaDataKey.StripeFlatFee,
        stripePercentageFeeKey: SiteMetaDataKey.StripePercentageFee,
      },
    });
    const { preRequestCharge, stripeFlatFee, stripePercentageFee } = result.data;
    this.pricingData = {
      perRequestCharge: preRequestCharge.value as string,
      stripeFlatFee: stripeFlatFee.value as string,
      stripePercentageFee: stripePercentageFee.value as string,
    };
  }

  reduceAfter(state: RootAppState): RootAppState {
    return state.mapState({
      home: mapState({
        loadingPricingData: to(false),
        pricingPerRequest: to(this.pricingData?.perRequestCharge || ""),
        pricingStripeFlatFee: to(this.pricingData?.stripeFlatFee || ""),
        pricingStripePercentageFee: to(this.pricingData?.stripePercentageFee || ""),
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
