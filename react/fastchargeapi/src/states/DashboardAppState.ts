import { AppState, PartialProps } from "react-appevent-redux";
import { AccountActivity, AccountHistory } from "../events/DashboardEvent";

export class DashboardAppState extends AppState {
    accountBalance = "0";
    loadingBalance = true;
    loadingActivities = true;
    activities: AccountActivity[] = [];
    description = "";
    accountHistories: AccountHistory[] = [];
    loadingStripeLoginLink = false;
    stripeLoginLink = "";

    constructor(props: PartialProps<DashboardAppState>) {
        super();
        this.assignProps(props);
    }
}
