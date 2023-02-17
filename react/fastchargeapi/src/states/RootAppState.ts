import { AppState, PartialProps } from "react-appevent-redux";
import { HomeAppState } from "./HomeAppState";
import { SearchAppState } from "./SearchAppState";
import { AppDetailAppState } from "./AppDetailAppState";

export class RootAppState extends AppState {
    home = new HomeAppState({});
    search = new SearchAppState({});
    appDetail = new AppDetailAppState({});

    constructor(props: PartialProps<RootAppState>) {
        super();
        this.assignProps(props);
    }
}
