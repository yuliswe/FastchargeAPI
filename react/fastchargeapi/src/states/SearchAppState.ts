import { AppState, PartialProps } from "react-appevent-redux";

export class SearchAppState extends AppState {
    numResults = 1;

    constructor(props: PartialProps<SearchAppState>) {
        super();
        this.assignProps(props);
    }
}
