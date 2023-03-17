import { AppEvent, AppEventStream, mapState, to } from "react-appevent-redux";
import { RootAppState } from "../states/RootAppState";
import { getGQLClient } from "../graphql-client";
import { AppContext } from "../AppContext";
import { gql } from "@apollo/client";
import { GQLGetUserAppsQuery, GQLGetUserAppsQueryVariables } from "../__generated__/gql-operations";

export type UserApp = GQLGetUserAppsQuery["user"]["apps"][0];
class LoadMyApps extends AppEvent<RootAppState> {
    constructor(public context: AppContext) {
        super();
    }

    reducer(state: RootAppState): RootAppState {
        return state.mapState({
            myApps: mapState({
                loading: to(true),
            }),
        });
    }

    apps: UserApp[] = [];
    async *run(state: RootAppState): AppEventStream<RootAppState> {
        let { client, currentUser } = await getGQLClient(this.context);
        let result = await client.query<GQLGetUserAppsQuery, GQLGetUserAppsQueryVariables>({
            query: gql`
                query GetUserApps($user: ID!) {
                    user(pk: $user) {
                        apps {
                            name
                            description
                        }
                    }
                }
            `,
            variables: {
                user: currentUser,
            },
        });
        this.apps = result.data.user.apps;
    }

    reduceAfter(state: RootAppState): RootAppState {
        return state.mapState({
            myApps: mapState({
                loading: to(false),
                apps: to(this.apps),
            }),
        });
    }
}

export const MyAppsEvent = {
    LoadMyApps,
};
