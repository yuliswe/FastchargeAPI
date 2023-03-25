import { AppState, PartialProps } from "react-appevent-redux";
import { AppDetailEndpoint, AppDetailInfo, AppDetailPricing } from "../events/AppDetailEvent";

export class AppDetailAppState extends AppState {
    loadingAppInfo = true;
    loadingPricing = true;
    loadingEndpoints = true;

    pricings: AppDetailPricing[] = [];
    endpoints: AppDetailEndpoint[] = [];
    appInfo: AppDetailInfo | null = null;
    appReadmeContent: string | null = null;
    appAuthor = "";

    constructor(props: PartialProps<AppDetailAppState>) {
        super();
        this.assignProps(props);
    }
}
