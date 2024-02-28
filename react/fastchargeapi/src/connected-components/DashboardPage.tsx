import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Box, Button, CircularProgress, Divider, Grid, Link, Menu, MenuItem, Paper, Typography } from "@mui/material";
import "chart.js/auto";
import React from "react";
import { AfterEventOfType } from "react-appevent-redux";
import { Line } from "react-chartjs-2";
import { connect } from "react-redux";
import Terminal, { ColorMode, TerminalInput } from "react-terminal-ui";
import { AppContext, ReactAppContextType } from "src/AppContext";
import {
  AccountActivityReason,
  AccountActivityStatus,
  AccountActivityType,
  DashboardAccountActivityFragment,
  StripeTransferStatus,
} from "src/__generated__/gql/graphql";
import { DashboardEvent } from "src/events/DashboardEvent";
import { DashboardPageQuery, RouteURL } from "src/routes";
import {
  DocumentationDialog,
  SupportDocumentation,
  openDocumentationDialog,
  supportDocumenationDefault,
} from "src/stateless-components/DocumentationDialog";
import { LogTable, LogTableOnChangeHandler } from "src/stateless-components/LogTable";
import { DashboardAppState } from "src/states/DashboardAppState";
import { RootAppState } from "src/states/RootAppState";
import { appStore, reduxStore } from "src/store-config";

type Props = {
  dashboard: DashboardAppState;
};

type State = {
  moveMoneyMenuAnchorEl: HTMLElement | null;
  stripeLoginLinkTimeout: number;
} & SupportDocumentation;

class _DashboardPage extends React.PureComponent<Props, State> {
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

  static isLoading(): boolean {
    const { loadingBalance, loadingActivities } = appStore.getState().dashboard;
    return loadingBalance || loadingActivities;
  }

  static fetchData(context: AppContext, params: {}, query: DashboardPageQuery): Promise<void> {
    const beforeDate = query.sdate ? Number.parseInt(query.sdate) : Date.now();
    return new Promise((resolve) => {
      appStore.dispatch(new DashboardEvent.LoadUserInfo(context));
      appStore.dispatch(
        new DashboardEvent.LoadActivities(context, {
          beforeDate,
        })
      );
      appStore.dispatch(
        new DashboardEvent.LoadAccountHistory(context, {
          beforeDate,
        })
      );
      const unsub = reduxStore.subscribe(() => {
        if (!_DashboardPage.isLoading()) {
          unsub();
          resolve();
        }
      });
    });
  }

  allActivities() {
    return this.appState.activities;
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

  async componentDidMount() {
    await _DashboardPage.fetchData(
      this._context,
      this._context.route.params,
      this._context.route.query.entries() as DashboardPageQuery
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

  reason(activity: DashboardAccountActivityFragment): string {
    switch (activity.reason) {
      case AccountActivityReason.Topup:
        return "Top-up";
      case AccountActivityReason.Payout:
        return "Payout";
      case AccountActivityReason.PayoutFee:
        return "Fee";
      case AccountActivityReason.ApiPerRequestCharge:
        return "API Request";
      case AccountActivityReason.ApiMinMonthlyCharge:
        return "API Subscription";
      case AccountActivityReason.ApiMinMonthlyChargeUpgrade:
        return "API Subscription Upgrade";
      case AccountActivityReason.FastchargeapiPerRequestServiceFee:
        return "Service Fee";
      case AccountActivityReason.RefundApiMinMonthlyCharge:
        return "Refund API Subscription";
    }
  }

  spent(activity: DashboardAccountActivityFragment): string {
    if (activity.type === AccountActivityType.Outgoing) {
      return `$${activity.amount}`;
    }
    return "";
  }

  earned(activity: DashboardAccountActivityFragment): string {
    if (activity.type === AccountActivityType.Incoming) {
      return `$${activity.amount}`;
    }
    return "";
  }

  date(activity: DashboardAccountActivityFragment): string {
    const date = new Date(activity.createdAt);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  }

  activitiesPerPage(): number {
    return this._context.mediaQuery.lg.up ? 15 : 5;
  }

  accountHistory() {
    return this.appState.accountHistories;
  }

  eta(activity: DashboardAccountActivityFragment): string {
    if (activity.reason === AccountActivityReason.Payout) {
      if (activity.stripeTransfer?.transferAt) {
        const date = new Date(activity.stripeTransfer.transferAt);
        return date.toDateString();
      }
    } else if (activity.status === AccountActivityStatus.Pending && activity.settleAt) {
      const date = new Date(activity.settleAt);
      return date.toDateString();
    }
    return "";
  }

  status(activity: DashboardAccountActivityFragment): string {
    if (activity.reason === AccountActivityReason.Payout) {
      switch (activity.stripeTransfer?.status) {
        case StripeTransferStatus.PendingTransfer:
          return "On the way";
        case StripeTransferStatus.Transferred:
          return "";
      }
    }
    switch (activity.status) {
      case AccountActivityStatus.Pending:
        return "Pending";
      case AccountActivityStatus.Settled:
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
    for (const v of this.accountHistory()) {
      values.push(Number.parseFloat(v.closingBalance));
      labels.push(new Date(v.closingTime).toLocaleDateString());
    }
    values.reverse();
    labels.reverse();
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

  userName(): string | undefined {
    return this.appState.userAccountInfo?.author || this.appState.userAccountInfo?.email;
  }

  render() {
    return (
      <React.Fragment>
        <Typography variant="h2" mb={4} mt={2} ml={1}>
          Welcome back{this.userName() ? `, ${this.userName()!}` : ""}!
        </Typography>
        <Grid container spacing={4}>
          <Grid item xl={8} lg={7} xs={12}>
            <Paper sx={{ padding: 5 }}>
              <Typography variant="h4" sx={{ position: "relative" }} component={Box} display="flex" alignItems="center">
                <Box flexGrow={1}>Account</Box>
                <Button variant="contained" size="small" onClick={this.handleMenu} endIcon={<KeyboardArrowDownIcon />}>
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
                  this.appState.userAccountInfo.balance
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
                <Link href={RouteURL.onboardPage()} target="_blank" color="info.main">
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
              <LogTable<DashboardAccountActivityFragment>
                tableName="Activities"
                urlNamespace="s"
                activities={this.allActivities()}
                activitiesPerPage={this.activitiesPerPage()}
                onChange={this.handleActivitiesPageChange}
                renderCell={(head: string, activity: DashboardAccountActivityFragment) => {
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
                    case "Receiving":
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
                    title: "Receiving",
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
            href={RouteURL.accountPage()}
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
