import { AppState, PartialProps } from "react-appevent-redux";
import { Error404AppState } from "src/states/Error404AppState";
import { TopUpAppState } from "src/states/TopUpAppState";
import { AccountAppState } from "src/states/AccountAppState";
import { AppDetailAppState } from "src/states/AppDetailAppState";
import { AppSearchResultState } from "src/states/AppSearchResultState";
import { DashboardAppState } from "src/states/DashboardAppState";
import { HomeAppState } from "src/states/HomeAppState";
import { MyAppDetailAppState } from "src/states/MyAppDetailAppState";
import { MyAppsAppState } from "src/states/MyAppsAppState";
import { SubscriptionDetailAppState } from "src/states/SubscriptionDetailAppState";
import { SubscriptionsAppState } from "src/states/SubscriptionsAppState";
import { TermsAppState } from "src/states/TermsAppState";

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
