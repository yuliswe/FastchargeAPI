import { gql } from "graphql-tag";
import { AppEvent, AppEventStream, mapState, to } from "react-appevent-redux";
import { AppContext } from "../AppContext";
import {
    GQLAppFullTextSearchQuery,
    GQLAppFullTextSearchQueryVariables,
    GQLQueryAppFullTextSearchArgs,
} from "../__generated__/gql-operations";
import { getGQLClient } from "../graphql-client";
import { RootAppState } from "../states/RootAppState";

export type SearchResult = GQLAppFullTextSearchQuery["appFullTextSearch"][0];
class SearchResultEvent extends AppEvent<RootAppState> {
    constructor(public context: AppContext, public options: GQLQueryAppFullTextSearchArgs) {
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
        const { client, currentUser } = await getGQLClient(this.context);
        const result = await client.query<GQLAppFullTextSearchQuery, GQLAppFullTextSearchQueryVariables>({
            query: gql`
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
            `,
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
