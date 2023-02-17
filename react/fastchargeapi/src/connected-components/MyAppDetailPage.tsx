import React from "react";
import { MyAppDetailAppState } from "../states/MyAppDetailAppState";
import { RootAppState } from "../states/RootAppState";
import { connect } from "react-redux";
import {
    Autocomplete,
    Box,
    Button,
    Checkbox,
    Divider,
    FormControl,
    Grid,
    InputLabel,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
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
import AddIcon from "@mui/icons-material/Add";
type Props = {
    myAppDetail: MyAppDetailAppState;
};
class _MyAppDetailPage extends React.Component<Props> {
    getAPIList() {
        return [
            {
                method: "GET",
                path: "/api/v1/endpoint",
                destination: "https://google.ca/",
            },
            {
                method: "GET",
                path: "/api/v1/endpoint",
                destination: "https://google.ca/",
            },
            {
                method: "GET",
                path: "/api/v1/endpoint",
                destination: "https://google.ca/",
            },
            {
                method: "GET",
                path: "/api/v1/endpoint",
                destination: "https://google.ca/",
            },
            {
                method: "GET",
                path: "/api/v1/endpoint",
                destination: "https://google.ca/",
            },
            {
                method: "GET",
                path: "/api/v1/endpoint",
                destination: "https://google.ca/",
            },
        ];
    }

    getAppName() {
        return "My App";
    }

    getPricingList() {
        return [
            {
                name: "Free",
                chargePerCall: "0.001",
                minMonthlyCharge: "0.00",
                description: "Free plan",
                freeQuota: 1000,
            },
        ];
    }

    render() {
        return (
            <Stack spacing={10}>
                <Stack>
                    <Stack
                        direction="row"
                        mb={5}
                        spacing={3}
                        alignItems="center"
                    >
                        <Typography variant="h6">
                            {this.getAppName()}
                        </Typography>
                        <Button variant="contained" color="secondary">
                            Publish
                        </Button>
                    </Stack>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography mb={1} fontSize={14} variant="h6">
                                App name
                            </Typography>
                            <TextField />
                        </Grid>
                        <Grid item xs={6}>
                            <Typography mb={1} fontSize={14} variant="h6">
                                Repository
                            </Typography>
                            <TextField fullWidth />
                        </Grid>
                        <Grid item xs={6}>
                            <Typography mb={1} fontSize={14} variant="h6">
                                Homepage
                            </Typography>
                            <TextField fullWidth />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography mb={1} fontSize={14} variant="h6">
                                Description
                            </Typography>
                            <TextField multiline rows={4} fullWidth />
                        </Grid>
                    </Grid>
                </Stack>
                {/* Start Pricing Section */}
                <Stack>
                    <Typography variant="h6" mb={5}>
                        Pricing
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        <Button variant="contained" endIcon={<AddIcon />}>
                            Add Pricing
                        </Button>
                    </Stack>
                    <Table sx={{ mt: 2 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell width={50}>
                                    <Checkbox />
                                </TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Charge per call</TableCell>
                                <TableCell>Min monthly charge</TableCell>
                                <TableCell>Free quota</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {this.getPricingList().map((pricing) => (
                                <TableRow>
                                    <TableCell width={50}>
                                        <Checkbox />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            label="Name"
                                            fullWidth
                                            color="secondary"
                                            // defaultValue={api.destination}
                                            sx={{
                                                bgcolor: "background.default",
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            label="Amount"
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
                                            label="Amount"
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
                                            label="Number"
                                            fullWidth
                                            type="number"
                                            color="secondary"
                                            // defaultValue={api.destination}
                                            sx={{
                                                bgcolor: "background.default",
                                            }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Stack>
                {/* Start API Section */}
                <Stack>
                    <Typography variant="h6" mb={5}>
                        Endpoints
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        <Button variant="contained" endIcon={<AddIcon />}>
                            Add API
                        </Button>
                        <Button variant="contained" color="secondary" disabled>
                            Delete
                        </Button>
                    </Stack>
                    <Table sx={{ mt: 2 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell width={50}>
                                    <Checkbox />
                                </TableCell>
                                <TableCell>Http method</TableCell>
                                <TableCell>Path</TableCell>
                                <TableCell>Destination</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {this.getAPIList().map((api) => (
                                <TableRow>
                                    <TableCell width={50}>
                                        <Checkbox />
                                    </TableCell>
                                    <TableCell width={200}>
                                        <Autocomplete
                                            disablePortal
                                            options={[
                                                "GET",
                                                "POST",
                                                "PUT",
                                                "DELETE",
                                                "PATCH",
                                                "OPTIONS",
                                                "HEAD",
                                            ]}
                                            defaultValue={api.method}
                                            color="secondary"
                                            sx={{
                                                bgcolor: "background.default",
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    color="secondary"
                                                    {...params}
                                                    label="Method"
                                                />
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            label="Path"
                                            color="secondary"
                                            fullWidth
                                            defaultValue={api.path}
                                            sx={{
                                                bgcolor: "background.default",
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            label="Destination"
                                            fullWidth
                                            color="secondary"
                                            defaultValue={api.destination}
                                            sx={{
                                                bgcolor: "background.default",
                                            }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Stack>
            </Stack>
        );
    }
}

export const MyAppDetailPage = connect<Props, {}, {}, RootAppState>(
    (rootAppState: RootAppState) => ({
        myAppDetail: rootAppState.myAppDetail,
    })
)(_MyAppDetailPage);
