import { Button, Card, CardActions, CardContent, Chip, Grid, Link, Stack, Typography } from "@mui/material";
import React from "react";
import { connect } from "react-redux";
import { AppContext, ReactAppContextType } from "../AppContext";
import { SubscriptionEvent, UserSubscription } from "../events/SubscriptionEvent";
import { RootAppState } from "../states/RootAppState";
import { SubscriptionsAppState } from "../states/SubscriptionsAppState";
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
                    <Grid item key={sub.pk}>
                        <Card sx={{ p: 3 }}>
                            <CardContent>
                                <Stack direction="row" spacing={1}>
                                    <Typography variant="h4" display="flex" alignItems="center">
                                        {sub.app.title || sub.app.name}
                                    </Typography>
                                    <Typography variant="body2" display="flex" alignItems="center">
                                        @{sub.app.name}
                                    </Typography>
                                </Stack>
                                <Typography variant="body2" display="flex" alignItems="center" mb={2}>
                                    Published by {sub.app.owner.author}
                                </Typography>
                                <Typography variant="body2">Since {this.subscribedSince(sub)}</Typography>
                                <Typography variant="body1">
                                    Subscribed to{" "}
                                    <Chip component="span" color="success" label={this.plan(sub)} size="medium" />
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button variant="contained" color="primary" LinkComponent={Link} href={sub.app.name}>
                                    Manage
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
