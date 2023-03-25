import React from "react";
import { RootAppState } from "../states/RootAppState";
import { connect } from "react-redux";
import {
    Button,
    Card,
    CardActions,
    CardContent,
    Divider,
    Grid,
    Link,
    Stack,
    TextField,
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
    appState: MyAppsAppState;
};
type _State = {
    newAuthorName: string | null;
} & SupportDocumentation;
class _MyAppsPage extends React.Component<_Props, _State> {
    static contextType = ReactAppContextType;
    get _context(): AppContext {
        return this.context as AppContext;
    }
    constructor(props: _Props) {
        super(props);
        this.state = {
            newAuthorName: null,
            ...supportDocumenationDefault,
        };
    }
    appsList() {
        return this.props.appState.apps;
    }
    updatedOn(app: UserApp) {
        return new Date(app.updatedAt).toLocaleDateString();
    }

    componentDidMount(): void {
        appStore.dispatch(new MyAppsEvent.LoadMyApps(this._context));
    }

    renderCreateAppDocumentation() {
        return (
            <Terminal height="8em" colorMode={ColorMode.Light}>
                <Typography variant="body1">We recommend using the cli tool to complete this operation.</Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 700 }}>
                    To add create a new app, run the following command:
                </Typography>
                <TerminalInput>{`fastcharge app create [APP_NAME]`}</TerminalInput>
            </Terminal>
        );
    }

    renderUpdateAuthorNameDocumentation() {
        return (
            <Terminal height="8em" colorMode={ColorMode.Light}>
                <Typography variant="body1">We recommend using the cli tool to complete this operation.</Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 700 }}>
                    To add change your author name, run the following command:
                </Typography>
                <TerminalInput>{`fastcharge account update --author [Name]`}</TerminalInput>
            </Terminal>
        );
    }

    render() {
        return (
            <React.Fragment>
                <Typography variant="h6" mb={1}>
                    Identity
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="label" mb={1}>
                    Author name
                </Typography>
                <Grid container>
                    <Grid item xs={12} md={6} lg={4}>
                        <TextField
                            fullWidth
                            placeholder="Display your name that other users see"
                            value={this.state.newAuthorName ?? this.props.appState.authorName}
                            onClick={() => {
                                openDocumentationDialog(this, () => this.renderUpdateAuthorNameDocumentation());
                            }}
                            // onChange={(e) => {
                            //     this.setState({
                            //         newAuthorName: e.target.value,
                            //     });
                            // }}
                        />
                    </Grid>
                </Grid>
                <Typography variant="h6" mb={1} mt={5}>
                    Manage Apps
                </Typography>
                <Button
                    variant="contained"
                    size="small"
                    endIcon={<AddIcon />}
                    onClick={() => {
                        openDocumentationDialog(this, () => this.renderCreateAppDocumentation());
                    }}
                >
                    New App
                </Button>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2} mt={2}>
                    {this.appsList().map((app, index) => (
                        <Grid item key={index}>
                            <Card sx={{ p: 3, borderRadius: 5 }}>
                                <CardContent>
                                    <Stack direction="row" spacing={1}>
                                        <Typography variant="h6" display="flex" alignItems="center">
                                            {app.title || app.name}
                                        </Typography>
                                        <Typography variant="body1" display="flex" alignItems="center">
                                            @{app.name}
                                        </Typography>
                                    </Stack>
                                    <Typography variant="body1">Updated on {this.updatedOn(app)}</Typography>
                                    {/* <Typography variant="body1" mt={2}>
                                    {app.endpoints}{" "}
                                    {app.endpoints > 1
                                        ? "endpoint"
                                        : "endpoints"}
                                </Typography> */}
                                </CardContent>
                                <CardActions>
                                    <Button variant="contained" color="secondary" component={Link} href={`${app.name}`}>
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

export const MyAppsPage = connect<_Props, {}, {}, RootAppState>((rootAppState: RootAppState) => ({
    appState: rootAppState.myApps,
}))(_MyAppsPage);
