import React from "react";
import { RootAppState } from "../states/RootAppState";
import { connect } from "react-redux";
import {
    Button,
    Card,
    CardActions,
    CardContent,
    Grid,
    Link,
    Stack,
    Typography,
} from "@mui/material";
import { MyAppsAppState } from "../states/MyAppsAppState";
import { MyAppsEvent, UserApp } from "../events/MyAppsEvent";
import { appStore } from "../store-config";
import { AppContext, ReactAppContextType } from "../AppContext";
import AddIcon from "@mui/icons-material/Add";
import {
    DocumentationDialog,
    SupportDocumentation,
    openDocumentationDialog,
    supportDocumenationDefault,
} from "../stateless-components/DocumentationDialog";
import Terminal, { ColorMode, TerminalInput } from "react-terminal-ui";
type _Props = {
    myAppsAppState: MyAppsAppState;
};
type _State = {} & SupportDocumentation;
class _MyAppsPage extends React.Component<_Props, _State> {
    static contextType = ReactAppContextType;
    get _context(): AppContext {
        return this.context as AppContext;
    }
    constructor(props: _Props) {
        super(props);
        this.state = {
            ...supportDocumenationDefault,
        };
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

    renderCreateAppDocumentation() {
        return (
            <Terminal height="12em" colorMode={ColorMode.Light}>
                <Typography variant="body1">
                    We recommend using the cli tool to add an API endpoint.
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 700 }}>
                    To add create a new app, run the following command,
                    replacing "myapp" with the name of your app.
                </Typography>
                <TerminalInput>{`fastcharge app create "myapp"`}</TerminalInput>
            </Terminal>
        );
    }

    render() {
        return (
            <React.Fragment>
                <Button
                    variant="contained"
                    endIcon={<AddIcon />}
                    onClick={() => {
                        openDocumentationDialog(this, () =>
                            this.renderCreateAppDocumentation()
                        );
                    }}
                >
                    New App
                </Button>
                <Grid container spacing={2} mt={2}>
                    {this.appsList().map((app, index) => (
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
                                        color="secondary"
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
                <DocumentationDialog parent={this} />
            </React.Fragment>
        );
    }
}

export const MyAppsPage = connect<_Props, {}, {}, RootAppState>(
    (rootAppState: RootAppState) => ({
        myAppsAppState: rootAppState.myApps,
    })
)(_MyAppsPage);
