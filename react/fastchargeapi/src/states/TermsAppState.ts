import { AppState, PartialProps } from "react-appevent-redux";

export class TermsAppState extends AppState {
    loading = true;
    pricingPerRequest = "0";
    pricingStripePercentageFee = "0";
    pricingStripeFlatFee = "0";
    constructor(props: PartialProps<TermsAppState>) {
        super();
        this.assignProps(props);
    }
}
