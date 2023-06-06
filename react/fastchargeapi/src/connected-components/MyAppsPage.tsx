import AddIcon from "@mui/icons-material/Add";
import {
    Button,
    Divider,
    Grid,
    Link,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import React from "react";
import { connect } from "react-redux";
import Terminal, { ColorMode, TerminalInput } from "react-terminal-ui";
import { AppContext, ReactAppContextType } from "../AppContext";
import { MyAppsEvent, UserApp } from "../events/MyAppsEvent";
import {
    DocumentationDialog,
    SupportDocumentation,
    openDocumentationDialog,
    supportDocumenationDefault,
} from "../stateless-components/DocumentationDialog";
import { MyAppsAppState } from "../states/MyAppsAppState";
import { RootAppState } from "../states/RootAppState";
import { appStore, reduxStore } from "../store-config";
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

    static isLoading(): boolean {
        return appStore.getState().myApps.loading;
    }

    static async fetchData(context: AppContext, params: {}, query: {}): Promise<void> {
        return new Promise((resolve, reject) => {
            appStore.dispatch(new MyAppsEvent.LoadMyApps(context));
            const unsub = reduxStore.subscribe(() => {
                if (!_MyAppsPage.isLoading()) {
                    resolve();
                    unsub();
                }
            });
        });
    }

    async componentDidMount() {
        await _MyAppsPage.fetchData(this._context, this._context.route.params, this._context.route.query);
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
            <Stack spacing={4}>
                <Paper sx={{ padding: 5 }}>
                    <Typography variant="h4" mb={1}>
                        Author Name
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    {/* <Typography variant="label" mb={1}>
                        Author name
                    </Typography> */}
                    <Grid container>
                        <Grid item xs={12} md={6} lg={4}>
                            <TextField
                                fullWidth
                                placeholder="Display your name that other users see"
                                value={this.state.newAuthorName ?? this.props.appState.authorName}
                                helperText="This is the name that other users will see when on apps created by you."
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
                </Paper>
                <Paper sx={{ padding: 5 }}>
                    <Stack direction="row" spacing={1} sx={{ display: "flex", alignItems: "center" }}>
                        <Typography variant="h4" mb={1} sx={{ flexGrow: 1 }}>
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
                    </Stack>
                    <Divider sx={{ my: 2 }} />
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>App Title</TableCell>
                                <TableCell>Last Update</TableCell>
                                <TableCell align="right">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {this.appsList().map((app, index) => (
                                <TableRow key={app.name}>
                                    <TableCell>{app.name}</TableCell>
                                    <TableCell>{app.title || app.name}</TableCell>
                                    <TableCell>{this.updatedOn(app)}</TableCell>
                                    <TableCell align="right">
                                        <Button
                                            variant="outlined"
                                            color="secondary"
                                            component={Link}
                                            href={`${app.name}`}
                                        >
                                            Manage
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {this.appsList().length === 0 && (
                        <Typography variant="body2" m={2} color="grey.700">
                            Create an app to get started.
                        </Typography>
                    )}
                </Paper>
                <DocumentationDialog parent={this} />
            </Stack>
        );
    }
}

export const MyAppsPage = connect<_Props, {}, {}, RootAppState>((rootAppState: RootAppState) => ({
    appState: rootAppState.myApps,
}))(_MyAppsPage);
