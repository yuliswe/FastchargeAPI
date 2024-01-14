import { AppEvent, AppEventStream, mapState, to } from "react-appevent-redux";
import { AppContext } from "../AppContext";
import { graphql } from "../__generated__/gql";
import { AppFullTextSearchQuery, QueryAppFullTextSearchArgs } from "../__generated__/gql/graphql";
import { getGQLClient } from "../graphql-client";
import { RootAppState } from "../states/RootAppState";

export type SearchResult = AppFullTextSearchQuery["appFullTextSearch"][0];
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

  public response: SearchResult[] = [];
  async *run(state: RootAppState): AppEventStream<RootAppState> {
    const { client } = await getGQLClient(this.context);
    const result = await client.query({
      query: graphql(`
        query appFullTextSearch($query: String, $tag: String, $orderBy: AppFullTextSearchOrderBy) {
          appFullTextSearch(query: $query, tag: $tag, orderBy: $orderBy) {
            pk
            name
            title
            owner {
              author
            }
            description
          }
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
