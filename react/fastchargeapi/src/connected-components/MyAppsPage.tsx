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
import { MyAppsEvent, UserApp } from "../events/MyAppsEvent";
import { appStore } from "../store-config";
import { AppContext, ReactAppContextType } from "../AppContext";
type Props = {
    myAppsAppState: MyAppsAppState;
};
class _MyAppsPage extends React.Component<Props> {
    static contextType = ReactAppContextType;
    get _context(): AppContext {
        return this.context as AppContext;
    }
    appsList() {
        return this.props.myAppsAppState.apps;
    }
    version(app: UserApp) {
        return "1.0.0";
    }
    published(app: UserApp) {
        return new Date().toLocaleDateString();
    }

    componentDidMount(): void {
        appStore.dispatch(new MyAppsEvent.LoadMyApps(this._context));
    }

    render() {
        return (
            <Grid container spacing={2}>
                {this.appsList().map((app) => (
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
                                        {this.version(app)}
                                    </Typography>
                                </Stack>
                                <Typography variant="body1">
                                    Published on {this.published(app)}
                                </Typography>
                                {/* <Typography variant="body1" mt={2}>
                                    {app.endpoints}{" "}
                                    {app.endpoints > 1
                                        ? "endpoint"
                                        : "endpoints"}
                                </Typography> */}
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
