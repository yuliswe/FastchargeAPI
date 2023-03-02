import React from "react";
import { RootAppState } from "../states/RootAppState";
import { connect } from "react-redux";
import {
    Box,
    Button,
    Grid,
    Link,
    Menu,
    MenuItem,
    Pagination,
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
import { DashboardAppState } from "../states/DashboardAppState";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { AccountActivity, DashboardEvent } from "../events/DashboardEvent";
import { appStore } from "../store-config";
import { AppContext, ReactAppContextType } from "../AppContext";
import {
    GQLAccountActivityReason,
    GQLAccountActivityType,
} from "../__generated__/gql-operations";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import {
    LogTable,
    LogTableOnChangeHandler,
} from "../stateless-components/LogTable";

type Props = {
    dashboard: DashboardAppState;
};

type State = {
    moveMoneyMenuAnchorEl: HTMLElement | null;
};

class _DashboardPage extends React.Component<Props, State> {
    static contextType = ReactAppContextType;
    get _context() {
        return this.context as AppContext;
    }

    constructor(props: Props) {
        super(props);
        this.state = {
            moveMoneyMenuAnchorEl: null,
        };
    }

    allActivities() {
        return this.props.dashboard.activities;
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
                return "Account Top-up";
            case GQLAccountActivityReason.Payout:
                return "User Withdrawal";
            case GQLAccountActivityReason.ApiPerRequestCharge:
                return "API Request";
            case GQLAccountActivityReason.ApiMinMonthlyCharge:
                return "API Monthly Fee";
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
        return date.toUTCString();
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
        return this.allActivities().slice(
            start,
            start + this.activitiesPerPage
        );
    }

    handlePageChange(page: number) {
        this._context.route.updateQuery({
            page: page.toString(),
        });
    }

    accountHistory() {
        return this.props.dashboard.accountHistories;
    }

    chartData() {
        if (this.accountHistory().length === 0) {
            return {
                labels: [],
                datasets: [],
            };
        }
        let sample: { label: string; value: number }[] = [];
        let curDate = this.accountHistory()[0].closingTime;
        let day = 1000 * 60 * 60 * 24;
        for (let [index, v] of this.accountHistory().entries()) {
            if (index % 10 === 0) {
                sample.push({
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
                    backgroundColor:
                        this._context.theme.palette.info.main + "33",
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

    handleActivitiesPageChange: LogTableOnChangeHandler = ({
        page,
        dateRange,
    }) => {
        appStore.dispatch(
            new DashboardEvent.LoadActivities(this._context, {
                beforeDate: dateRange.end,
            })
        );
    };

    renderActivities() {
        return (
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
                        case "Description":
                            return activity.description;
                        case "Earned":
                            return this.earned(activity);
                        case "Spent":
                            return this.spent(activity);
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
                        title: "Description",
                        flexGrow: true,
                    },
                    {
                        title: "Earned",
                    },
                    {
                        title: "Spent",
                    },
                ]}
            />
        );
    }

    render() {
        return (
            <Box>
                <Grid container>
                    <Grid item flexGrow={1}>
                        <Typography variant="h6">Account</Typography>
                        <Typography
                            variant="body1"
                            fontSize={30}
                            fontWeight={700}
                        >
                            ${this.props.dashboard.accountBalance}{" "}
                        </Typography>
                    </Grid>
                    <Grid item>
                        <Box>
                            <Button
                                variant="contained"
                                onClick={this.handleMenu}
                                endIcon={<KeyboardArrowDownIcon />}
                            >
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
                                onClose={this.handleClose}
                            >
                                <MenuItem
                                    onClick={this.handleClose}
                                    LinkComponent={Button}
                                >
                                    Add funds
                                </MenuItem>
                                <MenuItem
                                    href="/account"
                                    onClick={this.handleClose}
                                    LinkComponent={Button}
                                >
                                    Withdraw
                                </MenuItem>
                            </Menu>
                        </Box>
                    </Grid>
                </Grid>
                <Grid item lg={6} md={12} py={5}>
                    <Line
                        options={{
                            // maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: false,
                                },
                            },
                            // scales: {
                            //     x: {
                            //         grid: {
                            //             display: false,
                            //         },
                            //     },
                            // },
                        }}
                        data={this.chartData()}
                    />
                </Grid>
                <Box>{this.renderActivities()}</Box>
            </Box>
        );
    }
}

export const DashboardPage = connect<Props, {}, {}, RootAppState>(
    (rootAppState: RootAppState) => ({
        dashboard: rootAppState.dashboard,
    })
)(_DashboardPage);
