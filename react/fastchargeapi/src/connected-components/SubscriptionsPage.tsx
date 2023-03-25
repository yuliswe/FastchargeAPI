import React from "react";
import { RootAppState } from "../states/RootAppState";
import { connect } from "react-redux";
import { Button, Card, CardActions, CardContent, Grid, Stack, Typography, Link } from "@mui/material";
import { SubscriptionsAppState } from "../states/SubscriptionsAppState";
import { AppContext, ReactAppContextType } from "../AppContext";
import { SubscriptionEvent, UserSubscription } from "../events/SubscriptionEvent";
import { appStore } from "../store-config";
type Props = {
    appState: SubscriptionsAppState;
};
class _SubscriptionsPage extends React.Component<Props> {
    static contextType = ReactAppContextType;
    get _context(): AppContext {
        return this.context as AppContext;
    }

    get appState(): SubscriptionsAppState {
        return this.props.appState;
    }

    subscriptions(): UserSubscription[] {
        return this.appState.subscriptions;
    }

    subscribedSince(sub: UserSubscription): string {
        return new Date(sub.updatedAt).toLocaleDateString();
    }

    plan(sub: UserSubscription): string {
        return sub.pricing.name;
    }

    componentDidMount(): void {
        appStore.dispatch(new SubscriptionEvent.LoadSubscriptions(this._context));
    }

    render() {
        return (
            <Grid container spacing={2}>
                {this.subscriptions().map((sub, index) => (
                    <Grid item key={index}>
                        <Card sx={{ p: 3, borderRadius: 5 }}>
                            <CardContent>
                                <Stack direction="row" spacing={1}>
                                    <Typography variant="h6" display="flex" alignItems="center">
                                        {sub.app.title || sub.app.name}
                                    </Typography>
                                    <Typography variant="body1" display="flex" alignItems="center">
                                        @{sub.app.name}
                                    </Typography>
                                    {/* <Typography variant="body1" display="flex" fontSize={14} alignItems="center">
                                        {"v1.0.0"}
                                    </Typography> */}
                                </Stack>
                                <Typography variant="body1" display="flex" alignItems="center">
                                    Published by {sub.app.owner.author}
                                </Typography>
                                <Typography variant="body1" mt={2}>
                                    Subscribed since {this.subscribedSince(sub)}
                                </Typography>
                                <Typography variant="body1">Current plan: {this.plan(sub)}</Typography>
                            </CardContent>
                            <CardActions>
                                <Button variant="contained" color="secondary" LinkComponent={Link} href={sub.app.name}>
                                    View
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        );
    }
}

export const SubscriptionsPage = connect<Props, {}, {}, RootAppState>((rootAppState: RootAppState) => ({
    appState: rootAppState.subscriptions,
}))(_SubscriptionsPage);
