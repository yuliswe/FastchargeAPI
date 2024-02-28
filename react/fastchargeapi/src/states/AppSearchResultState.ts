import { AppState, PartialProps } from "react-appevent-redux";
import { AppSearchResultFragment } from "src/__generated__/gql/graphql";

export class AppSearchResultState extends AppState {
  loading = false;
  searchResults: AppSearchResultFragment[] = [];

  constructor(props: PartialProps<AppSearchResultState>) {
    super();
    this.assignProps(props);
  }
}
