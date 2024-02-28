import { AppEvent, AppEventStream, mapState, to } from "react-appevent-redux";
import { AppContext } from "src/AppContext";
import { graphql } from "src/__generated__/gql";
import { GetUserSubscriptionsQuery } from "src/__generated__/gql/graphql";
import { getGQLClient } from "src/graphql-client";
import { RootAppState } from "src/states/RootAppState";

export type UserSubscription = GetUserSubscriptionsQuery["getUser"]["subscriptions"][0];

class LoadSubscriptions extends AppEvent<RootAppState> {
  constructor(public context: AppContext) {
    super();
  }

  reducer(state: RootAppState): RootAppState {
    return state;
  }

  subscriptions: UserSubscription[] = [];
  async *run(state: RootAppState): AppEventStream<RootAppState> {
    const { client, currentUser } = await getGQLClient(this.context);
    const result = await client.query({
      query: graphql(`
        query GetUserSubscriptions($user: ID!) {
          getUser(pk: $user) {
            subscriptions {
              pk
              updatedAt
              pricing {
                name
              }
              app {
                title
                name
                owner {
                  author
                }
              }
            }
          }
        }
      `),
      variables: {
        user: currentUser!,
      },
    });
    this.subscriptions = result.data.getUser.subscriptions;
  }

  reduceAfter(state: RootAppState): RootAppState {
    return state.mapState({
      subscriptions: mapState({
        loading: to(false),
        subscriptions: to(this.subscriptions),
      }),
    });
  }
}

export const SubscriptionEvent = {
  LoadSubscriptions,
};
