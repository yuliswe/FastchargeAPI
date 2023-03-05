import { AppState, PartialProps } from "react-appevent-redux";
import { HomeAppState } from "./HomeAppState";
import { SearchAppState } from "./SearchAppState";
import { AppDetailAppState } from "./AppDetailAppState";
import { AccountAppState } from "./AccountAppState";
import { SubscriptionsAppState } from "./SubscriptionsAppState";
import { DashboardAppState } from "./DashboardAppState";
import { MyAppsAppState } from "./MyAppsAppState";
import { SubscriptionDetailAppState } from "./SubscriptionDetailAppState";
import { MyAppDetailAppState } from "./MyAppDetailAppState";

export class RootAppState extends AppState {
    home = new HomeAppState({});
    search = new SearchAppState({});
    appDetail = new AppDetailAppState({});
    account = new AccountAppState({});
    subscriptions = new SubscriptionsAppState({});
    dashboard = new DashboardAppState({});
    myApps = new MyAppsAppState({});
    myAppDetail = new MyAppDetailAppState({});
    subscriptionDetail = new SubscriptionDetailAppState({});
    terms = new HomeAppState({});

    constructor(props: PartialProps<RootAppState>) {
        super();
        this.assignProps(props);
    }
}
