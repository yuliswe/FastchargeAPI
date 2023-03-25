import React from "react";
import { RootAppState } from "../states/RootAppState";
import { connect } from "react-redux";
import { MyAppDetailAppState } from "../states/MyAppDetailAppState";
import {
    Autocomplete,
    AutocompleteRenderInputParams,
    Breadcrumbs,
    Button,
    Checkbox,
    Divider,
    Grid,
    IconButton,
    Link,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { MyAppDetailEvent } from "../events/MyAppDetailEvent";
import { appStore } from "../store-config";
import { ReactAppContextType, AppContext } from "../AppContext";
import Terminal, { ColorMode, TerminalInput } from "react-terminal-ui";
import EditIcon from "@mui/icons-material/Edit";
import CopyIcon from "@mui/icons-material/FileCopy";
import {
    DocumentationDialog,
    SupportDocumentation,
    openDocumentationDialog,
    supportDocumenationDefault,
} from "../stateless-components/DocumentationDialog";
import { GQLAppVisibility } from "../__generated__/gql-operations";
type _Props = {
    appState: MyAppDetailAppState;
};

type _State = {
    endpointCheckboxes: Set<string>; // Stores the IDs of the endpoints that are checked
    pricingCheckboxes: Set<string>; // Stores the IDs of the endpoints that are checked
} & SupportDocumentation;

class _MyAppDetailPage extends React.Component<_Props, _State> {
    static contextType = ReactAppContextType;
    get _context(): AppContext {
        return this.context as AppContext;
    }

    constructor(props: _Props) {
        super(props);
        this.state = {
            ...supportDocumenationDefault,
            endpointCheckboxes: new Set(),
            pricingCheckboxes: new Set(),
        };
    }

    getAPIList() {
        return this.appState.appDetail?.endpoints || [];
    }

    get appState(): MyAppDetailAppState {
        return this.props.appState;
    }

    getAppName() {
        return this._context.route.params["app"]!;
    }

    getPricingList() {
        return this.appState.appDetail?.pricingPlans || [];
    }

    componentDidMount(): void {
        appStore.dispatch(
            new MyAppDetailEvent.LoadAppInfo(this._context, {
                appName: this.getAppName(),
            })
        );
    }

    renderAddAPIDocumentation({ app }: { app: string }) {
        return (
            <Terminal height="12em" colorMode={ColorMode.Light}>
                <Typography variant="body1">We recommend using the cli tool to add an API endpoint.</Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 700 }}>
                    To add an endpoint, run the following command:
                </Typography>
                <TerminalInput>
                    {`fastcharge api add --app "${app}" \\\n    --method "GET" \\\n    --path "/example" \\\n    --destination "https://example.com/"`}
                </TerminalInput>
            </Terminal>
        );
    }

    renderAddPricingDocumentation({ app }: { app: string }) {
        return (
            <Terminal height="12em" colorMode={ColorMode.Light}>
                <Typography variant="body1">We recommend using the cli tool to add a pricing plan.</Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 700 }}>
                    To add a pricing, run the following command, replacing the values with your own:
                </Typography>
                <TerminalInput>
                    {`fastcharge pricing add --app "${app}" \\\n    --name "Premium" \\\n    --charge-per-request 0.001 \\\n    --min-monthly-charge 15 \\\n    --free-quota 1000`}
                </TerminalInput>
            </Terminal>
        );
    }

    renderModifyAppInfoDocumentation({ app, property, value }: { app: string; property: string; value: string }) {
        return (
            <Terminal height="9em" colorMode={ColorMode.Light}>
                <Typography variant="body1">We recommend using the cli tool to modify app information.</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    Run the following command, replacing the value with your own.
                </Typography>
                <TerminalInput>{`fastcharge app update "${app}" \\\n    --${property} "${value}"`}</TerminalInput>
            </Terminal>
        );
    }

    renderModifyAppVisibilityDocumentation({ app }: { app: string }) {
        return (
            <Terminal height="9em" colorMode={ColorMode.Light}>
                <Typography variant="body1">We recommend using the cli tool to modify app information.</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    Run the following command, replacing the value with your own.
                </Typography>
                <TerminalInput>{`fastcharge app update "${app}" \\\n    --make-public/--make-private`}</TerminalInput>
            </Terminal>
        );
    }

    renderModifyAPIDocumentation({ endpointID }: { endpointID: string }) {
        return (
            <Terminal height="14em" colorMode={ColorMode.Light}>
                <Typography variant="body1">We recommend using the cli tool to modify the endpoint.</Typography>
                <Typography variant="body1">
                    This endpoint has ID: <b>{endpointID}</b>
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    To update the endpoint, run the following command, replacing the values with your own.
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                    All values are optional:
                </Typography>
                <TerminalInput>
                    {`fastcharge api update "${endpointID}" \\\n    --path "/example" \\\n    --destination "https://example.com/" \\\n    --method "GET"`}
                </TerminalInput>
            </Terminal>
        );
    }

    renderModifyPricingDocumentation({ pricingID }: { pricingID: string }) {
        return (
            <Terminal height="14em" colorMode={ColorMode.Light}>
                <Typography variant="body1">We recommend using the cli tool to modify the pricing plan.</Typography>
                <Typography variant="body1">
                    This pricing has ID: <b>{pricingID}</b>
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    To update the pricing, run the following command, replacing the values with your own.
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                    All values are optional:
                </Typography>
                <TerminalInput>
                    {`fastcharge pricing update "${pricingID}" \\\n    --name "Premium" \\\n    --charge-per-request 0.001 \\\n    --min-monthly-charge 15 \\\n    --free-quota 1000`}
                </TerminalInput>
            </Terminal>
        );
    }

    renderDeleteAPIDocumentation({ endpointIDs }: { endpointIDs: string[] }) {
        return (
            <Terminal height="14em" colorMode={ColorMode.Light}>
                <Typography variant="body1">We recommend using the cli tool to delete the endpoint.</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    To delete the endpoint, run the following command:
                </Typography>
                <TerminalInput>
                    {endpointIDs.map(
                        (id: string, idx: number) =>
                            `fastcharge api delete "${id}" ${idx === endpointIDs.length - 1 ? "" : "\\\n"}`
                    )}
                </TerminalInput>
            </Terminal>
        );
    }

    renderDeletePricingDocumentation({ pricingIDs }: { pricingIDs: string[] }) {
        return (
            <Terminal height="14em" colorMode={ColorMode.Light}>
                <Typography variant="body1">We recommend using the cli tool to delete the pricing.</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    To delete the pricing, run the following command:
                </Typography>
                <TerminalInput>
                    {pricingIDs.map(
                        (id: string, idx: number) =>
                            `fastcharge api delete "${id}" ${idx === pricingIDs.length - 1 ? "" : "\\\n"}`
                    )}
                </TerminalInput>
            </Terminal>
        );
    }
    render() {
        return (
            <React.Fragment>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="/account/my-apps">
                        My Apps
                    </Link>
                    <Stack direction="row" alignItems="center">
                        <Typography variant="h6" display="flex" alignItems="center" color="text.primary">
                            {this.appState.appDetail?.title || this.appState.appDetail?.name}
                        </Typography>
                        <Typography variant="body1" display="flex" alignItems="center" color="text.primary" ml={1}>
                            @{this.appState.appDetail?.name}
                        </Typography>
                    </Stack>
                </Breadcrumbs>
                {/* <Button variant="contained" color="secondary" size="small" sx={{ my: 1 }}>
                    Publish
                </Button> */}
                <Divider sx={{ mt: 1, mb: 5 }} />
                <Stack spacing={10}>
                    <Stack>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography mb={1} variant="label">
                                    App Name
                                </Typography>
                                <TextField variant="standard" value={this.appState.appDetail?.name || ""} disabled />
                            </Grid>
                            <Grid item xs={6}>
                                <Stack direction="row" alignItems="center" mb={1}>
                                    <Typography variant="label">Title</Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            openDocumentationDialog(this, () =>
                                                this.renderModifyAppInfoDocumentation({
                                                    property: "title",
                                                    value: "[New Name]",
                                                    app: this.getAppName(),
                                                })
                                            );
                                        }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </Stack>
                                <TextField
                                    fullWidth
                                    disabled
                                    placeholder="Display name for this app"
                                    value={this.appState.appDetail?.title || ""}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Stack direction="row" alignItems="center" mb={1}>
                                    <Typography variant="label">Visibility</Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            openDocumentationDialog(this, () =>
                                                this.renderModifyAppVisibilityDocumentation({
                                                    app: this.getAppName(),
                                                })
                                            );
                                        }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </Stack>
                                <Autocomplete<GQLAppVisibility>
                                    disablePortal
                                    options={[GQLAppVisibility.Public, GQLAppVisibility.Private]}
                                    getOptionLabel={(option) =>
                                        (option[0].toUpperCase() as string) + (option.slice(1) as string)
                                    }
                                    // defaultValue={["Public", GQLAppVisibility.Public]}
                                    value={this.appState.appDetail?.visibility || GQLAppVisibility.Public}
                                    disabled
                                    color="secondary"
                                    sx={{
                                        maxWidth: 200,
                                        bgcolor: "background.default",
                                    }}
                                    renderInput={(params: AutocompleteRenderInputParams) => (
                                        <TextField variant="outlined" color="secondary" {...params} />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Stack direction="row" alignItems="center" mb={1}>
                                    <Typography variant="label">Repository</Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            openDocumentationDialog(this, () =>
                                                this.renderModifyAppInfoDocumentation({
                                                    property: "repository",
                                                    value: "https://github.com/username/myapp",
                                                    app: this.getAppName(),
                                                })
                                            );
                                        }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </Stack>
                                <TextField
                                    fullWidth
                                    disabled
                                    placeholder="URL to Github repository"
                                    defaultValue={this.appState.appDetail?.repository || ""}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Stack direction="row" alignItems="center" mb={1}>
                                    <Typography variant="label">Homepage</Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            openDocumentationDialog(this, () =>
                                                this.renderModifyAppInfoDocumentation({
                                                    property: "homepage",
                                                    value: "https://myproject/docs",
                                                    app: this.getAppName(),
                                                })
                                            );
                                        }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </Stack>
                                <TextField fullWidth disabled placeholder="URL to project or documentation." />
                            </Grid>
                            <Grid item xs={12}>
                                <Stack direction="row" alignItems="center" mb={1}>
                                    <Typography variant="label">README.md</Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            openDocumentationDialog(this, () =>
                                                this.renderModifyAppInfoDocumentation({
                                                    property: "readme",
                                                    value: "https://github.com/{user}/{repository}/blob/{branch}/README.md",
                                                    app: this.getAppName(),
                                                })
                                            );
                                        }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </Stack>
                                <TextField
                                    fullWidth
                                    disabled
                                    placeholder="URL to README.md, eg. https://github.com/{user}/{repository}/blob/{branch}/README.md"
                                    defaultValue={this.appState.appDetail?.readme || ""}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Stack direction="row" alignItems="center" mb={1}>
                                    <Typography variant="label">Description</Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            openDocumentationDialog(this, () =>
                                                this.renderModifyAppInfoDocumentation({
                                                    property: "description",
                                                    value: "My App description",
                                                    app: this.getAppName(),
                                                })
                                            );
                                        }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </Stack>
                                <TextField
                                    multiline
                                    rows={4}
                                    fullWidth
                                    defaultValue={this.appState.appDetail?.description || ""}
                                    placeholder="A short description that is displayed in the search result."
                                    disabled
                                />
                            </Grid>
                        </Grid>
                    </Stack>
                    {/* Start Pricing Section */}
                    <Stack>
                        <Typography variant="h6">Pricing</Typography>
                        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                            <Button
                                variant="contained"
                                size="small"
                                endIcon={<AddIcon />}
                                onClick={() => {
                                    openDocumentationDialog(this, () =>
                                        this.renderAddPricingDocumentation({
                                            app: this.getAppName(),
                                        })
                                    );
                                }}
                            >
                                Add Pricing
                            </Button>
                            <Button
                                variant="contained"
                                color="secondary"
                                size="small"
                                disabled={this.state.pricingCheckboxes.size == 0}
                                onClick={() => {
                                    openDocumentationDialog(this, () =>
                                        this.renderDeletePricingDocumentation({
                                            pricingIDs: [...this.state.pricingCheckboxes],
                                        })
                                    );
                                }}
                            >
                                Delete
                            </Button>
                        </Stack>
                        <Divider sx={{ mt: 2, mb: 5 }} />
                        <Table sx={{ mt: 2 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell width={50}>
                                        <Checkbox
                                            onChange={(e, checked) => {
                                                if (checked) {
                                                    this.setState({
                                                        pricingCheckboxes: new Set(
                                                            this.getPricingList().map((pricing) => pricing.pk)
                                                        ),
                                                    });
                                                } else {
                                                    this.setState({
                                                        pricingCheckboxes: new Set(),
                                                    });
                                                }
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Charge per call</TableCell>
                                    <TableCell>Min monthly charge</TableCell>
                                    <TableCell>Free quota</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {this.getPricingList().map((pricing, index) => (
                                    <TableRow key={index}>
                                        <TableCell width={50}>
                                            <Checkbox
                                                color="secondary"
                                                checked={this.state.pricingCheckboxes.has(pricing.pk)}
                                                onChange={(e, checked) => {
                                                    let newState = new Set(this.state.pricingCheckboxes);
                                                    if (checked) {
                                                        newState.add(pricing.pk);
                                                        this.setState({
                                                            pricingCheckboxes: newState,
                                                        });
                                                    } else {
                                                        newState.delete(pricing.pk);
                                                        this.setState({
                                                            pricingCheckboxes: newState,
                                                        });
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                onClick={() => {
                                                    void window.navigator.clipboard.writeText(pricing.pk);
                                                }}
                                            >
                                                <CopyIcon />
                                            </IconButton>
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                variant="standard"
                                                disabled
                                                fullWidth
                                                color="secondary"
                                                defaultValue={pricing.name}
                                                sx={{
                                                    bgcolor: "background.default",
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                variant="standard"
                                                disabled
                                                placeholder="Enter amount in USD"
                                                fullWidth
                                                type="number"
                                                color="secondary"
                                                defaultValue={pricing.chargePerRequest}
                                                sx={{
                                                    bgcolor: "background.default",
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                variant="standard"
                                                disabled
                                                placeholder="Enter amount in USD"
                                                fullWidth
                                                type="number"
                                                color="secondary"
                                                // defaultValue={api.destination}
                                                sx={{
                                                    bgcolor: "background.default",
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                variant="standard"
                                                disabled
                                                fullWidth
                                                type="number"
                                                color="secondary"
                                                defaultValue={pricing.freeQuota || 0}
                                                sx={{
                                                    bgcolor: "background.default",
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                onClick={() => {
                                                    openDocumentationDialog(this, () =>
                                                        this.renderModifyPricingDocumentation({
                                                            pricingID: pricing.pk,
                                                        })
                                                    );
                                                }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Stack>
                    {/* Start API Section */}
                    <Stack>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                            Endpoints
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="contained"
                                size="small"
                                endIcon={<AddIcon />}
                                onClick={() => {
                                    openDocumentationDialog(this, () =>
                                        this.renderAddAPIDocumentation({
                                            app: this.getAppName(),
                                        })
                                    );
                                }}
                            >
                                Add API
                            </Button>
                            <Button
                                variant="contained"
                                size="small"
                                color="secondary"
                                disabled={this.state.endpointCheckboxes.size == 0}
                                onClick={() => {
                                    openDocumentationDialog(this, () =>
                                        this.renderDeleteAPIDocumentation({
                                            endpointIDs: [...this.state.endpointCheckboxes],
                                        })
                                    );
                                }}
                            >
                                Delete
                            </Button>
                        </Stack>
                        <Divider sx={{ mt: 2, mb: 5 }} />
                        <Table sx={{ mt: 2 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell width={50}>
                                        <Checkbox
                                            onChange={(e, checked) => {
                                                if (checked) {
                                                    this.setState({
                                                        endpointCheckboxes: new Set(
                                                            this.getAPIList().map((api) => api.pk)
                                                        ),
                                                    });
                                                } else {
                                                    this.setState({
                                                        endpointCheckboxes: new Set(),
                                                    });
                                                }
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Http method</TableCell>
                                    <TableCell>Path</TableCell>
                                    <TableCell>Destination</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {this.getAPIList().map((api, index) => (
                                    <TableRow key={index}>
                                        <TableCell width={50}>
                                            <Checkbox
                                                color="secondary"
                                                checked={this.state.endpointCheckboxes.has(api.pk)}
                                                onChange={(e, checked) => {
                                                    let newState = new Set(this.state.endpointCheckboxes);
                                                    if (checked) {
                                                        newState.add(api.pk);
                                                        this.setState({
                                                            endpointCheckboxes: newState,
                                                        });
                                                    } else {
                                                        newState.delete(api.pk);
                                                        this.setState({
                                                            endpointCheckboxes: newState,
                                                        });
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                onClick={() => {
                                                    void window.navigator.clipboard.writeText(api.pk);
                                                }}
                                            >
                                                <CopyIcon />
                                            </IconButton>
                                        </TableCell>
                                        <TableCell width={200}>
                                            <Autocomplete
                                                disablePortal
                                                options={["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]}
                                                defaultValue={api.method}
                                                disabled
                                                color="secondary"
                                                sx={{
                                                    bgcolor: "background.default",
                                                }}
                                                renderInput={(params) => (
                                                    <TextField variant="standard" color="secondary" {...params} />
                                                )}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                variant="standard"
                                                color="secondary"
                                                fullWidth
                                                defaultValue={api.path}
                                                disabled
                                                sx={{
                                                    bgcolor: "background.default",
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                variant="standard"
                                                fullWidth
                                                color="secondary"
                                                defaultValue={api.destination}
                                                disabled
                                                sx={{
                                                    bgcolor: "background.default",
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                onClick={() => {
                                                    openDocumentationDialog(this, () =>
                                                        this.renderModifyAPIDocumentation({
                                                            endpointID: api.pk,
                                                        })
                                                    );
                                                }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Stack>
                </Stack>
                <DocumentationDialog parent={this} />
            </React.Fragment>
        );
    }
}

export const MyAppDetailPage = connect<_Props, {}, {}, RootAppState>((rootAppState: RootAppState) => ({
    appState: rootAppState.myAppDetail,
}))(_MyAppDetailPage);
