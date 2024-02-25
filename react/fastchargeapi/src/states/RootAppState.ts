import { AppState, PartialProps } from "react-appevent-redux";
import { Error404AppState } from "src/states/Error404AppState";
import { TopUpAppState } from "src/states/TopUpAppState";
import { AccountAppState } from "./AccountAppState";
import { AppDetailAppState } from "./AppDetailAppState";
import { AppSearchResultState } from "./AppSearchResultState";
import { DashboardAppState } from "./DashboardAppState";
import { HomeAppState } from "./HomeAppState";
import { MyAppDetailAppState } from "./MyAppDetailAppState";
import { MyAppsAppState } from "./MyAppsAppState";
import { SubscriptionDetailAppState } from "./SubscriptionDetailAppState";
import { SubscriptionsAppState } from "./SubscriptionsAppState";
import { TermsAppState } from "./TermsAppState";

export class RootAppState extends AppState {
  home = new HomeAppState({});
  search = new AppSearchResultState({});
  appDetail = new AppDetailAppState({});
  account = new AccountAppState({});
  subscriptions = new SubscriptionsAppState({});
  dashboard = new DashboardAppState({});
  myApps = new MyAppsAppState({});
  myAppDetail = new MyAppDetailAppState({});
  subscriptionDetail = new SubscriptionDetailAppState({});
  terms = new TermsAppState({});
  error404 = new Error404AppState({});
  topUp = new TopUpAppState({});

  constructor(props: PartialProps<RootAppState>) {
    super();
    this.assignProps(props);
  }
}
