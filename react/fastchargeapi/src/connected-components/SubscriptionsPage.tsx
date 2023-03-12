import React from "react";
import { RootAppState } from "../states/RootAppState";
import { connect } from "react-redux";
import {
    Button,
    Card,
    CardActions,
    CardContent,
    Grid,
    Stack,
    Typography,
    Link,
} from "@mui/material";
import { SubscriptionsAppState } from "../states/SubscriptionsAppState";
import { AppContext, ReactAppContextType } from "../AppContext";
import {
    SubscriptionEvent,
    UserSubscription,
} from "../events/SubscriptionEvent";
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

    publishedOn(sub: UserSubscription): string {
        return new Date().toLocaleDateString();
    }

    plan(sub: UserSubscription): string {
        return sub.pricing.name;
    }

    componentDidMount(): void {
        appStore.dispatch(
            new SubscriptionEvent.LoadSubscriptions(this._context)
        );
    }

    render() {
        return (
            <Grid container spacing={2}>
                {this.subscriptions().map((sub, index) => (
                    <Grid item key={index}>
                        <Card sx={{ p: 3, borderRadius: 5 }}>
                            <CardContent>
                                <Stack direction="row" spacing={1}>
                                    <Typography
                                        variant="body1"
                                        display="flex"
                                        fontWeight={700}
                                        alignItems="center"
                                    >
                                        {sub.app.name}
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        display="flex"
                                        fontSize={14}
                                        alignItems="center"
                                    >
                                        {"v1.0.0"}
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        fontSize={14}
                                        display="flex"
                                        alignItems="center"
                                    >
                                        {sub.app.owner.author}
                                    </Typography>
                                </Stack>
                                <Typography variant="body1">
                                    Published on {this.publishedOn(sub)}
                                </Typography>
                                <Typography variant="body1" mt={2}>
                                    Plan: {this.plan(sub)}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    LinkComponent={Link}
                                    href={sub.app.name}
                                >
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

export const SubscriptionsPage = connect<Props, {}, {}, RootAppState>(
    (rootAppState: RootAppState) => ({
        appState: rootAppState.subscriptions,
    })
)(_SubscriptionsPage);
