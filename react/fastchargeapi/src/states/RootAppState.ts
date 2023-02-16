import { AppState, PartialProps } from "react-appevent-redux";
import { HomeAppState } from "./HomeAppState";
import { SearchAppState } from "./SearchAppState";

export class RootAppState extends AppState {
    home = new HomeAppState({});
    search = new SearchAppState({});

    constructor(props: PartialProps<RootAppState>) {
        super();
        this.assignProps(props);
    }
}
