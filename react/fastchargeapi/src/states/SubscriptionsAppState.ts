import { AppState, PartialProps } from "react-appevent-redux";
import { UserSubscription } from "../events/SubscriptionEvent";

export class SubscriptionsAppState extends AppState {
    subscriptions: UserSubscription[] = [];
    loading = true;
    constructor(props: PartialProps<SubscriptionsAppState>) {
        super();
        this.assignProps(props);
    }
}
