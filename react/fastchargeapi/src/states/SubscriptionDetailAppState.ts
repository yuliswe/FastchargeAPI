import { AppState, PartialProps } from "react-appevent-redux";
import {
    AppInfo,
    AvailablePlan,
    SubscriptionDetail,
    UsageSummary,
} from "../events/SubscriptionDetailEvent";

export class SubscriptionDetailAppState extends AppState {
    loadingSubscriptionDetail = true;
    availablePlans: AvailablePlan[] = [];
    subscriptionDetail: SubscriptionDetail | null = null;
    currentlySubscribed = "";
    loadingAvailablePlans = true;
    appInfo: AppInfo | null = null;
    usageSummary: UsageSummary[] = [];
    loadingUsageSummary = true;

    currentSubscriptionPricing() {
        return this.subscriptionDetail?.pricing;
    }

    constructor(props: PartialProps<SubscriptionDetailAppState>) {
        super();
        this.assignProps(props);
    }
}
