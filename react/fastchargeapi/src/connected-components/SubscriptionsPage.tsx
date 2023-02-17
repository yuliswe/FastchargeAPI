import React from "react";
import { RootAppState } from "../states/RootAppState";
import { connect } from "react-redux";
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Grid,
    Stack,
    Typography,
} from "@mui/material";
import { SubscriptionsAppState } from "../states/SubscriptionsAppState";
type Props = {
    subscriptionsAppState: SubscriptionsAppState;
};
class _SubscriptionsPage extends React.Component<Props> {
    getAppsList() {
        return [
            {
                name: "My App",
                version: "1.0.1",
                author: "John Doe",
                published: new Date(),
                subscribedTo: "Basic Plan",
                subscribed: false,
            },
            {
                name: "My App",
                version: "1.0.1",
                author: "John Doe",
                published: new Date(),
                subscribedTo: "Basic Plan",
                subscribed: true,
            },
        ];
    }
    render() {
        return (
            <Grid container spacing={2}>
                {this.getAppsList().map((app) => (
                    <Grid item>
                        <Card sx={{ p: 3, borderRadius: 5 }}>
                            <CardContent>
                                <Stack direction="row" spacing={1}>
                                    <Typography
                                        variant="body1"
                                        display="flex"
                                        fontWeight={700}
                                        alignItems="center"
                                    >
                                        {app.name}
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        display="flex"
                                        fontSize={14}
                                        alignItems="center"
                                    >
                                        {app.version}
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        fontSize={14}
                                        display="flex"
                                        alignItems="center"
                                    >
                                        {app.author}
                                    </Typography>
                                </Stack>
                                <Typography variant="body1">
                                    Published on{" "}
                                    {app.published.toLocaleDateString()}
                                </Typography>
                                <Typography variant="body1" mt={2}>
                                    {app.subscribedTo}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button variant="contained" color="secondary">
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
        subscriptionsAppState: rootAppState.appDetail,
    })
)(_SubscriptionsPage);
