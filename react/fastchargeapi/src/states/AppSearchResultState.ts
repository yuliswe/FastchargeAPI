import { AppState, PartialProps } from "react-appevent-redux";
import { SearchResult } from "../events/AppSearchResultEvent";

export class AppSearchResultState extends AppState {
    loading = false;
    searchResults: SearchResult[] = [];

    constructor(props: PartialProps<AppSearchResultState>) {
        super();
        this.assignProps(props);
    }
}
