import { AppState, PartialProps } from "react-appevent-redux";

export class DashboardAppState extends AppState {
    constructor(props: PartialProps<DashboardAppState>) {
        super();
        this.assignProps(props);
    }
}
