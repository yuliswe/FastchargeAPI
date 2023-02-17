import { AppState, PartialProps } from "react-appevent-redux";

export class MyAppsAppState extends AppState {
    constructor(props: PartialProps<MyAppsAppState>) {
        super();
        this.assignProps(props);
    }
}
