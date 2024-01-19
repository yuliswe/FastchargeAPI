import { AppState, PartialProps } from "react-appevent-redux";
import { DashboardAccountActivityFragment, DashboardAccountHistoryFragment } from "../__generated__/gql/graphql";
import { UserAccountInfo } from "../events/DashboardEvent";

export class DashboardAppState extends AppState {
  loadingBalance = true;
  loadingActivities = true;
  loadingStripeLoginLink = false;
  activities: DashboardAccountActivityFragment[] = [];
  description = "";
  accountHistories: DashboardAccountHistoryFragment[] = [];
  stripeLoginLink = "";
  userAccountInfo: UserAccountInfo | null = null;

  constructor(props: PartialProps<DashboardAppState>) {
    super();
    this.assignProps(props);
  }
}
