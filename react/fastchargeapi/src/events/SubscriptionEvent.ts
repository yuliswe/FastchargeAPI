import { AppEvent, AppEventStream, mapState, to } from "react-appevent-redux";
import { RootAppState } from "../states/RootAppState";
import { AppContext } from "../AppContext";
import { getGQLClient } from "../graphql-client";
import { gql } from "@apollo/client";
import { GQLGetUserSubscriptionsQuery, GQLGetUserSubscriptionsQueryVariables } from "../__generated__/gql-operations";

export type UserSubscription = GQLGetUserSubscriptionsQuery["user"]["subscriptions"][0];

class LoadSubscriptions extends AppEvent<RootAppState> {
    constructor(public context: AppContext) {
        super();
    }

    reducer(state: RootAppState): RootAppState {
        return state;
    }

    subscriptions: UserSubscription[] = [];
    async *run(state: RootAppState): AppEventStream<RootAppState> {
        let { client, currentUser } = await getGQLClient(this.context);
        let result = await client.query<GQLGetUserSubscriptionsQuery, GQLGetUserSubscriptionsQueryVariables>({
            query: gql`
                query GetUserSubscriptions($user: ID!) {
                    user(pk: $user) {
                        subscriptions {
                            pk
                            pricing {
                                name
                            }
                            app {
                                name
                                owner {
                                    author
                                }
                            }
                        }
                    }
                }
            `,
            variables: {
                user: currentUser,
            },
        });
        this.subscriptions = result.data.user.subscriptions;
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
