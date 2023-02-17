
import { AppState, PartialProps } from "react-appevent-redux";

export class SubscriptionDetailAppState extends AppState {
    constructor(props: PartialProps<SubscriptionDetailAppState>) {
        super();
        this.assignProps(props);
    }
}
