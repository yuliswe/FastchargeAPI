import React from "react";
import { RootAppState } from "../states/RootAppState";
import { connect } from "react-redux";
import { SubscriptionDetailAppState } from "../states/SubscriptionDetailAppState";
import { Box, Breadcrumbs, Button, Divider, Grid, Link, Stack, Typography } from "@mui/material";
import { PricingCard } from "../stateless-components/PricingCard";
import { AvailablePlan, SubscriotionDetailEvent, UsageSummary } from "../events/SubscriptionDetailEvent";
import { appStore } from "../store-config";
import { AppContext, ReactAppContextType } from "../AppContext";
import { LogTable, LogTableOnChangeHandler } from "../stateless-components/LogTable";
import {
    DocumentationDialog,
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

    handleSummaryPageChange: LogTableOnChangeHandler = ({ page, dateRange }) => {
        appStore.dispatch(
            new SubscriotionDetailEvent.LoadUsageSummary(this._context, {
                appName: this.getAppNameFromUrl(),
                dateRange: dateRange,
            })
        );
    };

    renderChangeSubscriptionDocumentation({ plan, app }: { plan: string; app: string }) {
        return (
            <Terminal height="10em" colorMode={ColorMode.Light}>
                <Typography variant="body1">We recommend changing the subscription plan with the cli tool.</Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 700 }}>
                    To subscribe or change to the "{plan}" plan, run the following command:
                </Typography>
                <TerminalInput>{`fastapi subscription add "${app}" \\\n    --plan "${plan}"`}</TerminalInput>
                <Typography variant="body2" mt={2} gutterBottom>
                    For details on switching a subscription plan,{" "}
                    <Link href="/terms-of-service#pricing" target="_blank" color="info.main">
                        see the pricing documentation.
                    </Link>
                </Typography>
            </Terminal>
        );
    }

    renderUnsubscribeDocumentation({ app }: { app: string }) {
        return (
            <Terminal height="10em" colorMode={ColorMode.Light}>
                <Typography variant="body1">We recommend using the cli tool to unsubscribe the app.</Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 700 }}>
                    To unsubscribe from the app, run the following command:
                </Typography>
                <TerminalInput>{`fastapi subscription remove "${app}"`}</TerminalInput>

                <Typography variant="caption" mt={2}>
                    After unsubscribing, if you ever subscribe to this app again in the remaining period of your billing
                    month, you will not be charged again.
                </Typography>
            </Terminal>
        );
    }
    render() {
        return (
            <React.Fragment>
                <Stack spacing={10}>
                    <Stack>
                        <Breadcrumbs aria-label="breadcrumb" sx={{ display: "flex", alignItems: "center" }}>
                            <Link underline="hover" color="inherit" href="/account/subscriptions">
                                Subscriptions
                            </Link>
                            {/* <Typography color="text.primary">
                        {this.getAppNameFromUrl()}
                    </Typography> */}
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="h6" display="flex" alignItems="center">
                                    {this.appState.appInfo?.title || "Unnamed App"}
                                </Typography>
                                <Typography variant="body1" display="flex" alignItems="center">
                                    @{this.appState.appInfo?.name}
                                </Typography>
                                {/* <Typography variant="body1">1.3.7</Typography>
                                <Typography variant="body1">Published 10 months ago</Typography> */}
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
                        </Breadcrumbs>
                        <Divider sx={{ mb: 3, mt: 1 }} />
                        <Typography variant="body1">
                            {this.appState.appInfo?.description ||
                                "The author did not provide a description for this app."}
                        </Typography>
                    </Stack>
                    <Stack>
                        <Typography variant="h6">Subscription</Typography>
                        <Divider sx={{ mb: 5 }} />
                        <Grid container spacing={2}>
                            {this.availablePlans().map((pricing, index) => (
                                <Grid item xs={3} key={index} sx={{ minWidth: 300 }}>
                                    <PricingCard
                                        {...pricing}
                                        actionButton={
                                            <Button
                                                variant={this.isActivePlan(pricing) ? "contained" : "outlined"}
                                                color="secondary"
                                                onClick={() =>
                                                    openDocumentationDialog(this, () =>
                                                        this.renderChangeSubscriptionDocumentation({
                                                            app: this.getAppNameFromUrl(),
                                                            plan: pricing.name,
                                                        })
                                                    )
                                                }
                                            >
                                                {this.isActivePlan(pricing) ? "Subscribed" : "Change"}
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

export const SubscriptionDetailPage = connect<_Props, {}, {}, RootAppState>((rootAppState: RootAppState) => ({
    appState: rootAppState.subscriptionDetail,
}))(_SubscriptionDetailPage);
