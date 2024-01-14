import { AppEvent, AppEventStream, mapState, to } from "react-appevent-redux";
import { AppContext } from "../AppContext";
import { graphql } from "../__generated__/gql";
import { SiteMetaDataKey } from "../__generated__/gql/graphql";
import { GetQueryResult, getGQLClient } from "../graphql-client";
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
      terms: mapState({
        loading: to(false),
        pricingPerRequest: to(this.pricingData?.per_request_charge?.value || ""),
        pricingStripeFlatFee: to(this.pricingData?.stripe_flat_fee?.value || ""),
        pricingStripePercentageFee: to(this.pricingData?.stripe_percentage_fee?.value || ""),
      }),
    });
  }
}

export const TermsEvent = {
  LoadPricingData,
};
