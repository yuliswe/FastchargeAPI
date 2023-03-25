import { AppState, PartialProps } from "react-appevent-redux";
import { AccountActivity, AccountHistory, UserAccountInfo } from "../events/DashboardEvent";

export class DashboardAppState extends AppState {
    loadingBalance = true;
    loadingActivities = true;
    activities: AccountActivity[] = [];
    description = "";
    accountHistories: AccountHistory[] = [];
    loadingStripeLoginLink = false;
    stripeLoginLink = "";
    userAccountInfo: UserAccountInfo | null = null;

    constructor(props: PartialProps<DashboardAppState>) {
        super();
        this.assignProps(props);
    }
}
