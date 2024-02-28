import { AppEvent, AppEventStream, mapState, to } from "react-appevent-redux";
import { AppContext } from "src/AppContext";
import { graphql } from "src/__generated__/gql";
import { AppSearchResultFragment, QueryAppFullTextSearchArgs } from "src/__generated__/gql/graphql";
import { getGQLClient } from "src/graphql-client";
import { RootAppState } from "src/states/RootAppState";

class SearchResultEvent extends AppEvent<RootAppState> {
  constructor(public context: AppContext, public options: QueryAppFullTextSearchArgs) {
    super();
  }

  reducer(state: RootAppState): RootAppState {
    return state.mapState({
      search: mapState({
        loading: to(true),
      }),
    });
  }

  public response: AppSearchResultFragment[] = [];
  async *run(state: RootAppState): AppEventStream<RootAppState> {
    const { client } = await getGQLClient(this.context);
    const result = await client.query({
      query: graphql(`
        query appFullTextSearch($query: String, $tag: String, $orderBy: AppFullTextSearchOrderBy) {
          appFullTextSearch(query: $query, tag: $tag, orderBy: $orderBy) {
            ...AppSearchResult
          }
        }
        fragment AppSearchResult on App {
          pk
          name
          title
          owner {
            author
          }
          description
        }
      `),
      variables: this.options,
    });
    this.response = result.data.appFullTextSearch;
  }

  reduceAfter(state: RootAppState): RootAppState {
    return state.mapState({
      search: mapState({
        loading: to(false),
        searchResults: to(this.response),
      }),
    });
  }
}

export const AppSearchResultEvent = {
  SearchResultEvent,
};
