import { gql } from "@apollo/client";
import { AppEvent, AppEventStream, mapState, to } from "react-appevent-redux";
import { AppContext } from "../AppContext";
import {
    GQLSiteMetaDataKey,
    GQLTermsPageGetPricingDataQuery,
    GQLTermsPageGetPricingDataQueryVariables,
} from "../__generated__/gql-operations";
import { getGQLClient } from "../graphql-client";
import { RootAppState } from "../states/RootAppState";

type TermsPagePricingData = Map<GQLSiteMetaDataKey, string>;
class LoadPricingData extends AppEvent<RootAppState> {
    constructor(private context: AppContext) {
        super();
    }
    reducer(state: RootAppState): RootAppState {
        return state;
    }

    pricingData: TermsPagePricingData | null = null;
    async *run(state: RootAppState): AppEventStream<RootAppState> {
        const { client, currentUser } = await getGQLClient(this.context);
        const result = await client.query<GQLTermsPageGetPricingDataQuery, GQLTermsPageGetPricingDataQueryVariables>({
            query: gql`
                query TermsPageGetPricingData {
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
            terms: mapState({
                loading: to(false),
                pricingPerRequest: to(this.pricingData!.get(GQLSiteMetaDataKey.PricingPerRequestCharge) as string),
                pricingStripeFlatFee: to(this.pricingData!.get(GQLSiteMetaDataKey.PricingStripeFlatFee) as string),
                pricingStripePercentageFee: to(
                    this.pricingData!.get(GQLSiteMetaDataKey.PricingStripePercentageFee) as string
                ),
            }),
        });
    }
}

export const TermsEvent = {
    LoadPricingData,
};
