import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Box, Button, CircularProgress, Divider, Grid, Link, Menu, MenuItem, Paper, Typography } from "@mui/material";
import "chart.js/auto";
import React from "react";
import { AfterEventOfType } from "react-appevent-redux";
import { Line } from "react-chartjs-2";
import { connect } from "react-redux";
import Terminal, { ColorMode, TerminalInput } from "react-terminal-ui";
import { AppContext, ReactAppContextType } from "../AppContext";
import {
    GQLAccountActivityReason,
    GQLAccountActivityStatus,
    GQLAccountActivityType,
    GQLStripeTransferStatus,
} from "../__generated__/gql-operations";
import { AccountActivity, DashboardEvent } from "../events/DashboardEvent";
import {
    DocumentationDialog,
    SupportDocumentation,
    openDocumentationDialog,
    supportDocumenationDefault,
} from "../stateless-components/DocumentationDialog";
import { LogTable, LogTableOnChangeHandler } from "../stateless-components/LogTable";
import { DashboardAppState } from "../states/DashboardAppState";
import { RootAppState } from "../states/RootAppState";
import { appStore } from "../store-config";

type Props = {
    dashboard: DashboardAppState;
};

type State = {
    moveMoneyMenuAnchorEl: HTMLElement | null;
    stripeLoginLinkTimeout: number;
} & SupportDocumentation;

class _DashboardPage extends React.Component<Props, State> {
    static contextType = ReactAppContextType;
    get _context() {
        return this.context as AppContext;
    }

    constructor(props: Props) {
        super(props);
        this.state = {
            moveMoneyMenuAnchorEl: null,
            stripeLoginLinkTimeout: 0,
            ...supportDocumenationDefault,
        };
    }

    get appState(): DashboardAppState {
        return this.props.dashboard;
    }

    allActivities() {
        return this.appState.activities;
    }

    activityRange(): number {
        let d = this._context.route.query.get("date");
        return d ? Number.parseInt(d) : Date.now();
    }

    handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        this.setState({
            moveMoneyMenuAnchorEl: event.currentTarget,
        });
    };

    handleClose = () => {
        this.setState({
            moveMoneyMenuAnchorEl: null,
        });
    };

    componentDidMount() {
        appStore.dispatch(new DashboardEvent.LoadUserInfo(this._context));
        appStore.dispatch(
            new DashboardEvent.LoadActivities(this._context, {
                beforeDate: this.activityRange(),
            })
        );
        appStore.dispatch(
            new DashboardEvent.LoadAccountHistory(this._context, {
                beforeDate: this.activityRange(),
            })
        );
    }

    handleActivityDateChange = (date: Date | null) => {
        date = date || new Date();
        date.setHours(0, 0, 0, 0);
        this._context.route.updateQuery({
            date: date.getTime().toString(),
        });
        appStore.dispatch(
            new DashboardEvent.LoadActivities(this._context, {
                beforeDate: date.getTime(),
            })
        );
    };

    reason(activity: AccountActivity): string {
        switch (activity.reason) {
            case GQLAccountActivityReason.Topup:
                return "Top-up";
            case GQLAccountActivityReason.Payout:
                return "Payout";
            case GQLAccountActivityReason.PayoutFee:
                return "Fee";
            case GQLAccountActivityReason.ApiPerRequestCharge:
                return "API Request";
            case GQLAccountActivityReason.ApiMinMonthlyCharge:
                return "API Subscription";
            case GQLAccountActivityReason.ApiMinMonthlyChargeUpgrade:
                return "API Subscription Upgrade";
            case GQLAccountActivityReason.FastchargeapiPerRequestServiceFee:
                return "Service Fee";
        }
    }

    spent(activity: AccountActivity): string {
        if (activity.type === GQLAccountActivityType.Credit) {
            return `$${activity.amount}`;
        }
        return "";
    }

    earned(activity: AccountActivity): string {
        if (activity.type === GQLAccountActivityType.Debit) {
            return `$${activity.amount}`;
        }
        return "";
    }

    date(activity: AccountActivity): string {
        let date = new Date(activity.createdAt);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    }

    activitiesPerPage(): number {
        return this._context.mediaQuery.lg.up ? 15 : 5;
    }

    accountHistory() {
        return this.appState.accountHistories;
    }

    eta(activity: AccountActivity): string {
        if (activity.reason === GQLAccountActivityReason.Payout) {
            if (activity.stripeTransfer?.transferAt) {
                let date = new Date(activity.stripeTransfer?.transferAt);
                return date.toDateString();
            }
        } else if (activity.status === GQLAccountActivityStatus.Pending && activity.settleAt) {
            let date = new Date(activity.settleAt);
            return date.toDateString();
        }
        return "";
    }

    status(activity: AccountActivity): string {
        if (activity.reason === GQLAccountActivityReason.Payout) {
            switch (activity.stripeTransfer?.status) {
                case GQLStripeTransferStatus.Pending:
                    return "On the way";
                case GQLStripeTransferStatus.Transferred:
                    return "";
            }
        }
        switch (activity.status) {
            case GQLAccountActivityStatus.Pending:
                return "Pending";
            case GQLAccountActivityStatus.Settled:
                return "";
        }
        return "";
    }

    chartData() {
        if (this.accountHistory().length === 0) {
            return {
                labels: [],
                datasets: [],
            };
        }
        const values: number[] = [];
        const labels: string[] = [];
        for (let [index, v] of this.accountHistory().entries()) {
            values.push(Number.parseFloat(v.closingBalance));
            labels.push(new Date(v.closingTime).toLocaleDateString());
        }
        const data = {
            labels,
            datasets: [
                {
                    label: "",
                    data: values,
                    borderColor: this._context.theme.palette.info.main,
                    backgroundColor: this._context.theme.palette.info.main + "33",
                    tension: 0.5,
                    fill: {
                        target: "origin",
                        // above: "rgb(255, 0, 0)",
                        // below: this._context.theme.palette.info.main, // And blue below the origin
                    },
                    pointRadius: 0,
                },
            ],
        };
        return data;
    }

    handleActivitiesPageChange: LogTableOnChangeHandler = ({ page, dateRange }) => {
        appStore.dispatch(
            new DashboardEvent.LoadActivities(this._context, {
                beforeDate: dateRange.end,
            })
        );
    };

    renderTransferDocumentation() {
        return (
            <Terminal height="5em" colorMode={ColorMode.Light}>
                <Typography variant="body1" gutterBottom>
                    We recommend using the cli tool to transfer funds.
                </Typography>
                <TerminalInput>{`fastcharge account withdraw [AMOUNT]`}</TerminalInput>
            </Terminal>
        );
    }

    renderTopUpDocumentation() {
        return (
            <Terminal height="5em" colorMode={ColorMode.Light}>
                <Typography variant="body1" gutterBottom>
                    We recommend using the cli tool to add funds to your account.
                </Typography>
                <TerminalInput>{`fastapi account topup [AMOUNT]`}</TerminalInput>
            </Terminal>
        );
    }

    renderLoginStripeDocumentation() {
        return (
            <Box padding={5} maxWidth={500}>
                <Typography variant="h4" gutterBottom>
                    Verify Email Address
                </Typography>
                <Typography variant="body1" gutterBottom>
                    To verify your identity, we will send an email containing the Stripe login link to your email.
                </Typography>
                <Button
                    variant="contained"
                    color="secondary"
                    sx={{ mt: 2 }}
                    disabled={this.appState.loadingStripeLoginLink || this.state.stripeLoginLinkTimeout > 0}
                    endIcon={this.appState.loadingStripeLoginLink && <CircularProgress size={20} color="info" />}
                    onClick={() => {
                        appStore.dispatch(new DashboardEvent.SendStripeLoginLink(this._context));
                        appStore.addSchedule(
                            new AfterEventOfType(DashboardEvent.StripeLinkReady, {
                                id: "StripeLinkReady",
                                once: true,
                                onTriggered: () => {
                                    void (async () => {
                                        for (let i = 60; i > 0; i--) {
                                            this.setState({
                                                stripeLoginLinkTimeout: i,
                                            });
                                            await new Promise((resolve) => setTimeout(resolve, 1000));
                                        }
                                    })();
                                },
                            })
                        );
                    }}
                >
                    {this.state.stripeLoginLinkTimeout > 0
                        ? `Email Sent (Retry in ${this.state.stripeLoginLinkTimeout}s)`
                        : "Send Email"}
                </Button>
            </Box>
        );
    }

    render() {
        return (
            <React.Fragment>
                <Typography variant="h2" mb={4} mt={2} ml={1}>
                    Welcome back, {this.appState.userAccountInfo?.author || "Anonymous User"}
                </Typography>
                <Grid container spacing={4}>
                    <Grid item xl={8} lg={7} xs={12}>
                        <Paper sx={{ padding: 5 }}>
                            <Typography
                                variant="h4"
                                sx={{ position: "relative" }}
                                component={Box}
                                display="flex"
                                alignItems="center"
                            >
                                <Box flexGrow={1}>Account</Box>
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={this.handleMenu}
                                    endIcon={<KeyboardArrowDownIcon />}
                                >
                                    Move Money
                                </Button>
                            </Typography>
                            <Divider sx={{ my: 1 }} />
                            <Typography
                                variant="body1"
                                component={Box}
                                fontSize={30}
                                fontWeight={500}
                                display="flex"
                                alignItems="center"
                            >
                                <Box fontSize={25}>$</Box>
                                {this.appState.userAccountInfo?.balance ? (
                                    this.appState.userAccountInfo?.balance
                                ) : (
                                    <CircularProgress size="1em" sx={{ ml: 1 }} color="primary" />
                                )}
                            </Typography>
                            <Box pt={5} sx={{ position: "relative" }} height={300}>
                                <Line
                                    options={{
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                display: false,
                                            },
                                        },
                                        scales: {
                                            x: {
                                                ticks: {
                                                    autoSkip: true,
                                                    maxTicksLimit: 7,
                                                },
                                            },
                                            y: {
                                                ticks: {
                                                    autoSkip: true,
                                                    maxTicksLimit: 6,
                                                },
                                            },
                                        },
                                    }}
                                    data={this.chartData()}
                                />
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid item xl={4} lg={5} xs={12}>
                        <Paper sx={{ padding: 5 }}>
                            <Typography variant="h4" mb={1.5}>
                                Connect to Stripe
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="body1" gutterBottom>
                                As an API developer, you can set up a Stripe account to start receiving payment.
                            </Typography>
                            <Typography variant="body1" component="div" gutterBottom>
                                To set up a Stripe account,{" "}
                                <Link href="/onboard" target="_blank" color="info.main">
                                    go to the onboarding page
                                </Link>{" "}
                                and complete the registration.
                            </Typography>
                            If you have completed the setup above, you can log in to your Stripe portal.
                            <Typography variant="body1" gutterBottom></Typography>
                            <Box my={1}>
                                <Link
                                    color="info.main"
                                    onClick={() => {
                                        openDocumentationDialog(this, () => this.renderLoginStripeDocumentation());
                                    }}
                                >
                                    Having trouble signing in?
                                </Link>
                            </Box>
                            <Button
                                href="https://connect.stripe.com/express_login"
                                target="_blank"
                                color="secondary"
                                variant="outlined"
                                sx={{ mt: 2 }}
                            >
                                Sign in Stripe
                            </Button>
                        </Paper>
                    </Grid>
                    <Grid item xs={12}>
                        <Paper sx={{ padding: 5 }}>
                            <LogTable<AccountActivity>
                                tableName="Activities"
                                urlNamespace="s"
                                activities={this.allActivities()}
                                activitiesPerPage={this.activitiesPerPage()}
                                onChange={this.handleActivitiesPageChange}
                                renderCell={(head: string, activity: AccountActivity) => {
                                    switch (head) {
                                        case "Date":
                                            return this.date(activity);
                                        case "Reason":
                                            return this.reason(activity);
                                        case "App":
                                            return activity.billedApp?.name || "";
                                        case "Volume":
                                            return activity.usageSummary?.volume || "";
                                        case "Description":
                                            return activity.description;
                                        case "Income":
                                            return this.earned(activity);
                                        case "Spending":
                                            return this.spent(activity);
                                        case "Estimated Completion":
                                            return this.eta(activity);
                                        case "Consumed Free Quota":
                                            return activity.consumedFreeQuota && activity.consumedFreeQuota > 0
                                                ? activity.consumedFreeQuota
                                                : "";
                                        case "Status":
                                            return this.status(activity);
                                    }
                                }}
                                headers={[
                                    {
                                        title: "Date",
                                    },
                                    {
                                        title: "Reason",
                                    },
                                    {
                                        title: "App",
                                    },
                                    {
                                        title: "Volume",
                                    },
                                    {
                                        title: "Description",
                                        hideByDefault: true,
                                    },
                                    {
                                        title: "Status",
                                    },
                                    {
                                        title: "Estimated Completion",
                                    },
                                    {
                                        title: "Consumed Free Quota",
                                    },
                                    {
                                        title: "Income",
                                    },
                                    {
                                        title: "Spending",
                                    },
                                ]}
                            />
                        </Paper>
                    </Grid>
                </Grid>
                <DocumentationDialog parent={this} />
                <Menu
                    anchorEl={this.state.moveMoneyMenuAnchorEl}
                    anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "right",
                    }}
                    PaperProps={{
                        elevation: 5,
                        sx: {
                            backgroundColor: "grey.100",
                            borderRadius: 10,
                        },
                    }}
                    keepMounted
                    transformOrigin={{
                        vertical: "top",
                        horizontal: "right",
                    }}
                    open={Boolean(this.state.moveMoneyMenuAnchorEl)}
                    onClick={this.handleClose}
                >
                    <MenuItem
                        LinkComponent={Button}
                        onClick={() => {
                            openDocumentationDialog(this, () => this.renderTopUpDocumentation());
                            this.handleClose();
                        }}
                    >
                        Add funds
                    </MenuItem>
                    <MenuItem
                        href="/account"
                        onClick={() => {
                            openDocumentationDialog(this, () => this.renderTransferDocumentation());
                            this.handleClose();
                        }}
                        LinkComponent={Button}
                    >
                        Withdraw
                    </MenuItem>
                </Menu>
            </React.Fragment>
        );
    }
}

export const DashboardPage = connect<Props, {}, {}, RootAppState>((rootAppState: RootAppState) => ({
    dashboard: rootAppState.dashboard,
}))(_DashboardPage);
