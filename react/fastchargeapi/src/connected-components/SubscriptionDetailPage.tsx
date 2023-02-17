import React from "react";
import { RootAppState } from "../states/RootAppState";
import { connect } from "react-redux";
import { SubscriptionDetailAppState } from "../states/SubscriptionDetailAppState";
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Grid,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { PricingCard } from "../stateless-components/PricingCard";
type _State = {};

type _Props = {
    appState: SubscriptionDetailAppState;
};

class _SubscriptionDetailPage extends React.Component<_Props, _State> {
    constructor(props: _Props) {
        super(props);
        this.state = {};
    }

    getAppName() {
        return "My App";
    }

    getAccessLogs() {
        return [
            {
                date: new Date(),
                description: "API Usage",
                volume: 1,
                method: "GET",
                endpoint: "/api/v1/charge",
                spent: "0.01",
            },
        ];
    }

    getPricingList() {
        return [
            {
                name: "Basic",
                description: "Basic description",
                minMonthlyCharge: "0.01",
                chargePerCall: "0.01",
                freeQuota: 1000,
                isActive: false,
            },
            {
                name: "Standard",
                description: "Standard description",
                minMonthlyCharge: "0.02",
                chargePerCall: "0.02",
                freeQuota: 1000,
                isActive: true,
            },
            {
                name: "Premium",
                description: "Premium description",
                minMonthlyCharge: "0.03",
                chargePerCall: "0.03",
                freeQuota: 1000,
                isActive: false,
            },
        ];
    }

    render() {
        return (
            <Stack spacing={10}>
                <Stack mb={5} spacing={3}>
                    <Stack
                        direction="row"
                        spacing={1}
                        mt={5}
                        alignItems="center"
                    >
                        <Typography variant="h6">
                            {this.getAppName()}
                        </Typography>
                        <Typography variant="body1">1.3.7</Typography>
                        <Typography variant="body1">
                            Published 10 months ago
                        </Typography>
                        <Box width={4}></Box>
                        <Button variant="contained" color="secondary">
                            Unsubscribe
                        </Button>
                    </Stack>
                    <Typography variant="body1">App description</Typography>
                </Stack>
                <Stack>
                    <Typography variant="h6" mb={2}>
                        Subscription
                    </Typography>
                    <Grid container spacing={2}>
                        {this.getPricingList().map((pricing, index) => (
                            <Grid item>
                                <PricingCard
                                    {...pricing}
                                    actionButton={
                                        <Button
                                            variant={
                                                pricing.isActive
                                                    ? "contained"
                                                    : "outlined"
                                            }
                                            color="secondary"
                                        >
                                            {pricing.isActive
                                                ? "Subscribed"
                                                : "Change"}
                                        </Button>
                                    }
                                ></PricingCard>
                            </Grid>
                        ))}
                    </Grid>
                </Stack>
                <Stack>
                    <Typography variant="h6" mb={2}>
                        Access Logs
                    </Typography>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Http method</TableCell>
                                <TableCell>Endpoint</TableCell>
                                <TableCell>Volume</TableCell>
                                <TableCell>Cost</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {this.getAccessLogs().map((log, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        {log.date.toDateString()}
                                    </TableCell>
                                    <TableCell>{log.description}</TableCell>
                                    <TableCell>{log.method}</TableCell>
                                    <TableCell>{log.endpoint}</TableCell>
                                    <TableCell>{log.volume}</TableCell>
                                    <TableCell>
                                        {log.spent ? "$" + log.spent : ""}
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

export const SubscriptionDetailPage = connect<_Props, {}, {}, RootAppState>(
    (rootAppState: RootAppState) => ({
        appState: rootAppState.subscriptionDetail,
    })
)(_SubscriptionDetailPage);
