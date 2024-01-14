import { AppEvent, AppEventStream, mapState, to } from "react-appevent-redux";
import { AppContext } from "../AppContext";
import { graphql } from "../__generated__/gql";
import { GetUserAppsQuery } from "../__generated__/gql/graphql";
import { getGQLClient } from "../graphql-client";
import { RootAppState } from "../states/RootAppState";

export type UserApp = GetUserAppsQuery["getUser"]["apps"][0];
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
  authorName = "";
  async *run(state: RootAppState): AppEventStream<RootAppState> {
    const { client, currentUser } = await getGQLClient(this.context);
    const result = await client.query({
      query: graphql(`
        query GetUserApps($user: ID!) {
          getUser(pk: $user) {
            author
            apps {
              name
              description
              title
              updatedAt
            }
          }
        }
      `),
      variables: {
        user: currentUser!,
      },
    });
    this.apps = result.data.getUser.apps;
    this.authorName = result.data.getUser.author;
  }

  reduceAfter(state: RootAppState): RootAppState {
    return state.mapState({
      myApps: mapState({
        loading: to(false),
        apps: to(this.apps),
        authorName: to(this.authorName),
      }),
    });
  }
}

export const MyAppsEvent = {
  LoadMyApps,
};
