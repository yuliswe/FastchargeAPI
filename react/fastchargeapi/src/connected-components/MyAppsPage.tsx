import AddIcon from "@mui/icons-material/Add";
import {
    Button,
    Divider,
    Grid,
    Link,
    Paper,
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
import { appStore } from "../store-config";
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
                <Paper sx={{ padding: 5, borderRadius: 10 }} elevation={1}>
                    <Typography variant="h6" mb={1}>
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
                <Paper sx={{ padding: 5, borderRadius: 10, mt: 5 }} elevation={1}>
                    <Typography variant="h6" mb={1}>
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
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>App Title</TableCell>
                                <TableCell>App ID</TableCell>
                                <TableCell>Last Update</TableCell>
                                <TableCell align="right">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {this.appsList().map((app, index) => (
                                <TableRow key={app.name}>
                                    <TableCell>{app.title || app.name}</TableCell>
                                    <TableCell>{app.name}</TableCell>
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
                </Paper>
                <DocumentationDialog parent={this} />
            </React.Fragment>
        );
    }
}

export const MyAppsPage = connect<_Props, {}, {}, RootAppState>((rootAppState: RootAppState) => ({
    appState: rootAppState.myApps,
}))(_MyAppsPage);
