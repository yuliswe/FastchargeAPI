import { AppState, PartialProps } from "react-appevent-redux";
import { UserApp } from "../events/MyAppsEvent";
export class MyAppDetailAppState extends AppState {
    loading = true;
    constructor(props: PartialProps<MyAppDetailAppState>) {
        super();
        this.assignProps(props);
    }
}
