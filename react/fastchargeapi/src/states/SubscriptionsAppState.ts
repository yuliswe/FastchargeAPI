import { AppState, PartialProps } from "react-appevent-redux";

export class SubscriptionsAppState extends AppState {
    constructor(props: PartialProps<SubscriptionsAppState>) {
        super();
        this.assignProps(props);
    }
}
