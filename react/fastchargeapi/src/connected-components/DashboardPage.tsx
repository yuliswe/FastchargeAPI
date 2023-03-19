import React from "react";
import { RootAppState } from "../states/RootAppState";
import { connect } from "react-redux";
import { Box, Button, CircularProgress, Divider, Grid, Link, Menu, MenuItem, Stack, Typography } from "@mui/material";
import { DashboardAppState } from "../states/DashboardAppState";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { AccountActivity, DashboardEvent } from "../events/DashboardEvent";
import { appStore } from "../store-config";
import { AppContext, ReactAppContextType } from "../AppContext";
import {
    GQLAccountActivityReason,
    GQLAccountActivityStatus,
    GQLAccountActivityType,
    GQLStripeTransferStatus,
} from "../__generated__/gql-operations";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import { LogTable, LogTableOnChangeHandler } from "../stateless-components/LogTable";
import { AfterEventOfType } from "react-appevent-redux";
import {
    DocumentationDialog,
    SupportDocumentation,
    openDocumentationDialog,
    supportDocumenationDefault,
} from "../stateless-components/DocumentationDialog";
import Terminal, { ColorMode, TerminalInput } from "react-terminal-ui";

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
        appStore.dispatch(new DashboardEvent.LoadAccontBalance(this._context));
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

    activitiesPerPage = 20;

    numPages() {
        return Math.ceil(this.allActivities().length / this.activitiesPerPage);
    }

    activityPageNum(): number {
        let p = this._context.route.query.get("page");
        return p ? Number.parseInt(p) : 1;
    }

    currentPageActivities() {
        let start = (this.activityPageNum() - 1) * this.activitiesPerPage;
        return this.allActivities().slice(start, start + this.activitiesPerPage);
    }

    handlePageChange(page: number) {
        this._context.route.updateQuery({
            page: page.toString(),
        });
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
        let sample: { label: string; value: number }[] = [];
        for (let [index, v] of this.accountHistory().entries()) {
            if (index % 10 === 0) {
                sample.unshift({
                    label: "",
                    value: Number.parseFloat(v.closingBalance),
                });
            }
        }
        const data = {
            labels: sample.map((x) => x.label),
            datasets: [
                {
                    label: "",
                    data: sample.map((x) => x.value),
                    borderColor: this._context.theme.palette.info.main,
                    backgroundColor: this._context.theme.palette.info.main + "33",
                    tension: 0.1,
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
                <Typography variant="h6" gutterBottom>
                    Sign in to Stripe
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
                <Stack spacing={6}>
                    <Grid container>
                        <Grid item md={8} flexGrow={1}>
                            <Typography variant="h6">Account</Typography>
                            <Divider sx={{ mb: 1 }} />
                            <Typography variant="body1" fontSize={30} fontWeight={700}>
                                ${this.appState.accountBalance}{" "}
                            </Typography>
                        </Grid>
                        <Grid
                            item
                            xs={4}
                            sx={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "end",
                                alignItems: "start",
                            }}
                        >
                            <Button variant="contained" onClick={this.handleMenu} endIcon={<KeyboardArrowDownIcon />}>
                                Move Money
                            </Button>
                            <Menu
                                anchorEl={this.state.moveMoneyMenuAnchorEl}
                                anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "right",
                                }}
                                PaperProps={{
                                    elevation: 1,
                                    sx: {
                                        // backgroundColor: "background.default",
                                        borderRadius: 5,
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
                        </Grid>
                        <Grid item xs={12} sm={12} md={6} pt={5}>
                            <Line
                                options={{
                                    plugins: {
                                        legend: {
                                            display: false,
                                        },
                                    },
                                }}
                                data={this.chartData()}
                            />
                        </Grid>
                    </Grid>
                    <Box>
                        <Typography variant="h6">Stripe</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="body1">
                            As an API developer, you can set up a Stripe account to start receiving payment. If you are
                            using an API that's developed by someone else, you can skip this step.
                        </Typography>
                        <Typography variant="body1" component="div">
                            To set up a Stripe account,{" "}
                            <Link href="/onboard" target="_blank" color="info.main">
                                go to the onboarding page
                            </Link>{" "}
                            and complete the registration.
                        </Typography>
                        If you have completed the setup above, you can log in to your Stripe portal.
                        <Typography variant="body1"></Typography>
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
                    </Box>
                    <LogTable<AccountActivity>
                        tableName="Activities"
                        urlNamespace="s"
                        activities={this.allActivities()}
                        activitiesPerPage={20}
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
                            },
                            {
                                title: "Status",
                            },
                            {
                                title: "Estimated Completion",
                            },
                            {
                                title: "Income",
                            },
                            {
                                title: "Spending",
                            },
                        ]}
                    />
                </Stack>
                <DocumentationDialog parent={this} />
            </React.Fragment>
        );
    }
}

export const DashboardPage = connect<Props, {}, {}, RootAppState>((rootAppState: RootAppState) => ({
    dashboard: rootAppState.dashboard,
}))(_DashboardPage);
