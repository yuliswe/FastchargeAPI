import { AppEvent, AppEventStream, mapState, to } from "react-appevent-redux";
import { AppContext } from "../AppContext";
import { graphql } from "../__generated__/gql";
import { SiteMetaDataKey } from "../__generated__/gql/graphql";
import { getGQLClient } from "../graphql-client";
import { RootAppState } from "../states/RootAppState";

class LoadPricingData extends AppEvent<RootAppState> {
  constructor(private context: AppContext) {
    super();
  }
  reducer(state: RootAppState): RootAppState {
    return state;
  }

  queryPricingdata = graphql(`
    query TermsPageGetPricingData(
      $perRequestChargeKey: String!
      $stripeFlatFeeKey: String!
      $stripePercentageFeeKey: String!
    ) {
      perRequestCharge: getSiteMetaDataByKey(key: $perRequestChargeKey) {
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
  `);

  pricingData: {
    perRequestCharge: string;
    stripeFlatFee: string;
    stripePercentageFee: string;
  } | null = null;

  async *run(state: RootAppState): AppEventStream<RootAppState> {
    const { client } = await getGQLClient(this.context);
    const result = await client.query({
      query: this.queryPricingdata,
      variables: {
        perRequestChargeKey: SiteMetaDataKey.PerRequestCharge,
        stripeFlatFeeKey: SiteMetaDataKey.StripeFlatFee,
        stripePercentageFeeKey: SiteMetaDataKey.StripePercentageFee,
      },
    });
    this.pricingData = {
      perRequestCharge: result.data.perRequestCharge.value as string,
      stripeFlatFee: result.data.stripeFlatFee.value as string,
      stripePercentageFee: result.data.stripePercentageFee.value as string,
    };
  }

  reduceAfter(state: RootAppState): RootAppState {
    return state.mapState({
      terms: mapState({
        loading: to(false),
        pricingPerRequest: to(this.pricingData?.perRequestCharge || ""),
        pricingStripeFlatFee: to(this.pricingData?.stripeFlatFee || ""),
        pricingStripePercentageFee: to(this.pricingData?.stripePercentageFee || ""),
      }),
    });
  }
}

export const TermsEvent = {
  LoadPricingData,
};
