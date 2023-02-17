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
    Link,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import { MyAppsAppState } from "../states/MyAppsAppState";
type Props = {
    myAppsAppState: MyAppsAppState;
};
class _MyAppsPage extends React.Component<Props> {
    getAppsList() {
        return [
            {
                name: "myapp",
                version: "1.0.1",
                endpoints: 0,
                published: new Date(),
            },
            {
                name: "myapp",
                version: "1.0.1",
                endpoints: 0,
                published: new Date(),
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
                                </Stack>
                                <Typography variant="body1">
                                    Published on{" "}
                                    {app.published.toLocaleDateString()}
                                </Typography>
                                <Typography variant="body1" mt={2}>
                                    {app.endpoints}{" "}
                                    {app.endpoints > 1
                                        ? "endpoint"
                                        : "endpoints"}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button
                                    variant="contained"
                                    component={Link}
                                    href={`${app.name}`}
                                >
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

export const MyAppsPage = connect<Props, {}, {}, RootAppState>(
    (rootAppState: RootAppState) => ({
        myAppsAppState: rootAppState.myApps,
    })
)(_MyAppsPage);
