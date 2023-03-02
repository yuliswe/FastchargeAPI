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
import { SubscriptionEvent } from "../events/SubscriptionEvent";
import {
    AvailablePlan,
    SubscriotionDetailEvent,
    UsageSummary,
} from "../events/SubscriptionDetailEvent";
import { appStore } from "../store-config";
import { AppContext, ReactAppContextType } from "../AppContext";
import {
    LogTable,
    LogTableOnChangeHandler,
} from "../stateless-components/LogTable";
import {
    DocumentationDialog,
    DocumentationDialogProps,
    DocumentationName,
    SupportDocumentation,
    openDocumentationDialog,
} from "../stateless-components/DocumentationDialog";
import { supportDocumenationDefault } from "../stateless-components/DocumentationDialog";
import Terminal, { ColorMode, TerminalInput } from "react-terminal-ui";

type _Props = {
    appState: SubscriptionDetailAppState;
};
type _State = {} & SupportDocumentation;

class _SubscriptionDetailPage extends React.Component<_Props, _State> {
    static contextType = ReactAppContextType;
    get _context(): AppContext {
        return this.context as AppContext;
    }

    constructor(props: _Props) {
        super(props);
        this.state = { ...supportDocumenationDefault };
    }

    usageSummary(): UsageSummary[] {
        return this.appState.usageSummary;
    }

    get appState(): SubscriptionDetailAppState {
        return this.props.appState;
    }

    availablePlans(): AvailablePlan[] {
        return this.appState.availablePlans;
        // return [
        //     {
        //         name: "Basic",
        //         description: "Basic description",
        //         minMonthlyCharge: "0.01",
        //         chargePerCall: "0.01",
        //         freeQuota: 1000,
        //         isActive: false,
        //     },
        //     {
        //         name: "Standard",
        //         description: "Standard description",
        //         minMonthlyCharge: "0.02",
        //         chargePerCall: "0.02",
        //         freeQuota: 1000,
        //         isActive: true,
        //     },
        //     {
        //         name: "Premium",
        //         description: "Premium description",
        //         minMonthlyCharge: "0.03",
        //         chargePerCall: "0.03",
        //         freeQuota: 1000,
        //         isActive: false,
        //     },
        // ];
    }

    subscriptionDetail() {
        return this.appState.subscriptionDetail;
    }

    isActivePlan(plan: AvailablePlan): boolean {
        return plan.pk === this.appState.currentSubscriptionPricing()?.pk;
    }

    getAppNameFromUrl(): string {
        let app = this._context.route.params["app"];
        if (!app) {
            throw new Error("App name is missing from url");
        }
        return app;
    }

    componentDidMount(): void {
        appStore.dispatch(
            new SubscriotionDetailEvent.LoadAvailablePlans(this._context, {
                appName: this.getAppNameFromUrl(),
            })
        );
        appStore.dispatch(
            new SubscriotionDetailEvent.LoadUserSubscription(this._context, {
                appName: this.getAppNameFromUrl(),
            })
        );
        appStore.dispatch(
            new SubscriotionDetailEvent.LoadAppInfo(this._context, {
                appName: this.getAppNameFromUrl(),
            })
        );
        appStore.dispatch(
            new SubscriotionDetailEvent.LoadUsageSummary(this._context, {
                appName: this.getAppNameFromUrl(),
                dateRange: { end: Date.now() },
            })
        );
    }

    summaryDate(log: UsageSummary): string {
        return new Date(log.createdAt).toUTCString();
    }

    summaryVolume(log: UsageSummary): string {
        return log.volume.toString();
    }

    summaryCost(log: UsageSummary): string {
        return log.billingAccountActivity?.amount.toString() ?? "";
    }

    handleSummaryPageChange: LogTableOnChangeHandler = ({
        page,
        dateRange,
    }) => {
        appStore.dispatch(
            new SubscriotionDetailEvent.LoadUsageSummary(this._context, {
                appName: this.getAppNameFromUrl(),
                dateRange: dateRange,
            })
        );
    };

    renderChangeSubscriptionDocumentation({
        plan,
        app,
    }: {
        plan: string;
        app: string;
    }) {
        return (
            <Terminal height="10em" colorMode={ColorMode.Light}>
                <Typography variant="body1">
                    We recommend changing the subscription plan with the cli
                    tool.
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 700 }}>
                    To subscribe to the "{plan}" plan, run the following
                    command:
                </Typography>
                <TerminalInput>
                    {`fastapi subscription add "${app}" \\\n    --plan "${plan}"`}
                </TerminalInput>
            </Terminal>
        );
    }

    renderUnsubscribeDocumentation({ app }: { app: string }) {
        return (
            <Terminal height="10em" colorMode={ColorMode.Light}>
                <Typography variant="body1">
                    We recommend using the cli tool to unsubscribe the app.
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 700 }}>
                    To unsubscribe from the app, run the following command:
                </Typography>
                <TerminalInput>
                    {`fastapi subscription remove "${app}"`}
                </TerminalInput>
            </Terminal>
        );
    }
    render() {
        return (
            <React.Fragment>
                <Stack spacing={10}>
                    <Stack mb={5} spacing={3}>
                        <Stack
                            direction="row"
                            spacing={1}
                            mt={5}
                            alignItems="center"
                        >
                            <Typography variant="h6">
                                {this.appState.appInfo?.name}
                            </Typography>
                            <Typography variant="body1">1.3.7</Typography>
                            <Typography variant="body1">
                                Published 10 months ago
                            </Typography>
                            <Box width={4}></Box>
                            <Button
                                variant="outlined"
                                color="secondary"
                                size="small"
                                onClick={() =>
                                    openDocumentationDialog(this, () =>
                                        this.renderUnsubscribeDocumentation({
                                            app: this.getAppNameFromUrl(),
                                        })
                                    )
                                }
                            >
                                Unsubscribe
                            </Button>
                        </Stack>
                        <Typography variant="body1">
                            {this.appState.appInfo?.description ||
                                "The author did not provide a description for this app."}
                        </Typography>
                    </Stack>
                    <Stack>
                        <Typography variant="h6" mb={2}>
                            Subscription
                        </Typography>
                        <Grid container spacing={2}>
                            {this.availablePlans().map((pricing, index) => (
                                <Grid
                                    item
                                    xs={3}
                                    key={index}
                                    sx={{ minWidth: 300 }}
                                >
                                    <PricingCard
                                        {...pricing}
                                        actionButton={
                                            <Button
                                                variant={
                                                    this.isActivePlan(pricing)
                                                        ? "contained"
                                                        : "outlined"
                                                }
                                                color="secondary"
                                                onClick={() =>
                                                    openDocumentationDialog(
                                                        this,
                                                        () =>
                                                            this.renderChangeSubscriptionDocumentation(
                                                                {
                                                                    app: this.getAppNameFromUrl(),
                                                                    plan: pricing.name,
                                                                }
                                                            )
                                                    )
                                                }
                                            >
                                                {this.isActivePlan(pricing)
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
                        <LogTable<UsageSummary>
                            tableName="Usage Summary"
                            urlNamespace="s"
                            activities={this.usageSummary()}
                            activitiesPerPage={20}
                            onChange={this.handleSummaryPageChange}
                            renderCell={(headerTitle, activity) => {
                                switch (headerTitle) {
                                    case "Date":
                                        return this.summaryDate(activity);
                                    case "Request Volume":
                                        return this.summaryVolume(activity);
                                    case "Cost":
                                        return this.summaryCost(activity);
                                }
                            }}
                            headers={[
                                {
                                    title: "Date",
                                },
                                {
                                    title: "Request Volume",
                                },
                                {
                                    title: "Cost",
                                },
                            ]}
                        />
                    </Stack>
                </Stack>
                <DocumentationDialog parent={this} />
            </React.Fragment>
        );
    }
}

export const SubscriptionDetailPage = connect<_Props, {}, {}, RootAppState>(
    (rootAppState: RootAppState) => ({
        appState: rootAppState.subscriptionDetail,
    })
)(_SubscriptionDetailPage);
