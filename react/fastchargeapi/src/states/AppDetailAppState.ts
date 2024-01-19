import { AppState, PartialProps } from "react-appevent-redux";
import { AppDetailEndpointFragment, AppDetailPricingFragment } from "../__generated__/gql/graphql";
import { AppDetailInfo } from "../events/AppDetailEvent";

export class AppDetailAppState extends AppState {
  loadingAppInfo = true;
  loadingPricing = true;
  loadingEndpoints = true;

  pricings: AppDetailPricingFragment[] = [];
  endpoints: AppDetailEndpointFragment[] = [];
  appInfo: AppDetailInfo | null = null;
  appReadmeContent: string | null = null;
  appAuthor = "";

  constructor(props: PartialProps<AppDetailAppState>) {
    super();
    this.assignProps(props);
  }
}
