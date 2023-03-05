
import { AppState, PartialProps } from "react-appevent-redux";

export class TermsAppState extends AppState {
    constructor(props: PartialProps<TermsAppState>) {
        super();
        this.assignProps(props);
    }
}
