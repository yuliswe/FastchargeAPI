import { AppState, PartialProps } from "react-appevent-redux";

export class AppDetailAppState extends AppState {
    constructor(props: PartialProps<AppDetailAppState>) {
        super();
        this.assignProps(props);
    }
}
