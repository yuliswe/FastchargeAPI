import { AppEvent, AppEventStream, mapState, to } from "react-appevent-redux";
import { RootAppState } from "../states/RootAppState";
import { gql } from "graphql-tag";
import { getGQLClient } from "../graphql-client";
import { AppContext } from "../AppContext";
import { GQLAppFullTextSearchQuery, GQLAppFullTextSearchQueryVariables } from "../__generated__/gql-operations";

export type SearchResult = GQLAppFullTextSearchQuery["appFullTextSearch"][0];
class SearchResultEvent extends AppEvent<RootAppState> {
    constructor(
        public context: AppContext,
        public keyword: string,
    ) {
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
        let { client, currentUser } = await getGQLClient(this.context);
        let result = await client.query<
            GQLAppFullTextSearchQuery,
            GQLAppFullTextSearchQueryVariables
        >({
            query: gql`
                query appFullTextSearch($query: String!) {
                    appFullTextSearch(query: $query) {
                        name
                        owner {
                            author
                        }
                        description
                    }
            }
        `,
        variables: {
            query: this.keyword,
        },
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