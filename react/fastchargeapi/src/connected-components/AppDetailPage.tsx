import React from "react";
import { RootAppState } from "../states/RootAppState";
import { AppDetailAppState } from "../states/AppDetailAppState";
import { connect } from "react-redux";
import { Avatar, Box, Button, Container, Divider, Grid, Link, Stack, Typography } from "@mui/material";
import { SiteLayout } from "../SiteLayout";
import { PricingCard } from "../stateless-components/PricingCard";
import { AppDetailEndpoint, AppDetailEvent, AppDetailPricing } from "../events/AppDetailEvent";
import { appStore } from "../store-config";
import { AppContext, ReactAppContextType } from "../AppContext";
import ReactMarkdown from "react-markdown";
import type { PluggableList } from "react-markdown/lib/react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import remarkGithub from "remark-github";
import rehypeRemoveComments from "rehype-remove-comments";
import "highlight.js/styles/github.css";
import {
    DocumentationDialog,
    SupportDocumentation,
    openDocumentationDialog,
    supportDocumenationDefault,
} from "../stateless-components/DocumentationDialog";
import Terminal, { ColorMode, TerminalInput } from "react-terminal-ui";

type _Props = {
    appState: AppDetailAppState;
};
type _State = {} & SupportDocumentation;
class _AppDetailPage extends React.Component<_Props, _State> {
    static contextType = ReactAppContextType;
    get _context() {
        return this.context as AppContext;
    }

    constructor(props: _Props) {
        super(props);
        this.state = {
            ...supportDocumenationDefault,
        };
    }

    getPricingList(): AppDetailPricing[] {
        return this.appState.pricings;
    }

    get appState(): AppDetailAppState {
        return this.props.appState;
    }

    getAppPK(): string {
        return this._context.route.params["app"]!;
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
            new AppDetailEvent.LoadAppInfo(this._context, {
                app: this.getAppPK(),
            })
        );
        appStore.dispatch(
            new AppDetailEvent.LoadEndpoints(this._context, {
                app: this.getAppPK(),
            })
        );

        appStore.dispatch(
            new AppDetailEvent.LoadPricings(this._context, {
                app: this.getAppPK(),
            })
        );
    }

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

    render() {
        return (
            <SiteLayout>
                <Container maxWidth="xl">
                    <Grid container columnSpacing={5}>
                        <Grid item px={5} xs={9}>
                            <Stack spacing={5}>
                                <Box>
                                    <Stack direction="row" spacing={1} mt={5} mb={1} alignItems="center">
                                        <Typography variant="h6" id="description">
                                            {this.appState?.appInfo?.title || "Untitled App"}
                                        </Typography>
                                        <Typography variant="body1">@{this.appState?.appInfo?.name}</Typography>
                                        {/* <Typography variant="body1">1.3.7</Typography>
                                        <Typography variant="body1">Published 10 months ago</Typography> */}
                                    </Stack>
                                    <Divider sx={{ mb: 3 }} />
                                    <Typography variant="body1">
                                        {this.appState?.appInfo?.description ||
                                            "The author did not provide a description for this app."}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="h6" id="pricing">
                                        Pricing
                                    </Typography>
                                    <Divider sx={{ mb: 3 }} />
                                    <Grid container spacing={3}>
                                        {this.getPricingList().map((pricing: AppDetailPricing) => (
                                            <Grid item xs={12} md={6} lg={4} xl={3}>
                                                <PricingCard
                                                    {...pricing}
                                                    actionButton={
                                                        <Button
                                                            variant="outlined"
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
                                                            Subscribe
                                                        </Button>
                                                    }
                                                />
                                            </Grid>
                                        ))}
                                        {/* <Card
                                                variant="outlined"
                                                elevation={100}
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 5,
                                                    // bgcolor: "",
                                                    border: "none",
                                                    // backgroundImage:
                                                    //     "linear-gradient(to right, #ffecd2 0%, #fcb69f 100%)",
                                                }}
                                            >
                                                <CardContent>
                                                    <Typography
                                                        variant="body1"
                                                        mb={2}
                                                    >
                                                        Basic Plan
                                                    </Typography>
                                                    <Typography>
                                                        <b>Per request:</b>{" "}
                                                        $0.01
                                                    </Typography>
                                                    <Typography>
                                                        <b>
                                                            First request in 30
                                                            days:
                                                        </b>{" "}
                                                        $0.01
                                                    </Typography>
                                                    <Typography>
                                                        <b>Free quota:</b> first
                                                        1000 requests
                                                    </Typography>
                                                </CardContent>
                                                <CardActions>
                                                    
                                                </CardActions>
                                            </Card> */}
                                    </Grid>
                                </Box>
                                {this.appState.appReadmeContent && (
                                    <Box>
                                        <Typography variant="h6" id="readme">
                                            README.md
                                        </Typography>
                                        <Divider sx={{ mb: 3 }} />

                                        <ReactMarkdown
                                            children={this.appState.appReadmeContent}
                                            skipHtml={true}
                                            remarkPlugins={(() => {
                                                let plugins: PluggableList = [remarkGfm];
                                                if (this.appState.appInfo!.repository) {
                                                    plugins.push([
                                                        remarkGithub,
                                                        { repository: this.appState.appInfo!.repository },
                                                    ] as any);
                                                }
                                                return plugins;
                                            })()}
                                            rehypePlugins={[rehypeHighlight, rehypeRemoveComments]}
                                        />
                                    </Box>
                                )}
                                <Box>
                                    <Typography variant="h6" id="endpoints">
                                        Endpoints
                                    </Typography>
                                    <Divider sx={{ mb: 3 }} />
                                    <Stack spacing={2}>
                                        {this.appState?.endpoints?.map((endpoint: AppDetailEndpoint) => (
                                            <Box>
                                                <Stack direction="row" spacing={1}>
                                                    <Typography variant="body1" color="secondary.main" fontWeight={700}>
                                                        {endpoint.method}
                                                    </Typography>
                                                    <code>{endpoint.path}</code>
                                                </Stack>
                                                <Typography variant="body1">
                                                    {endpoint.description || "No description provided."}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            </Stack>
                        </Grid>
                        <Grid item xs={3} my={5}>
                            <Box position="sticky" top={50}>
                                <Typography variant="h6" fontWeight={700} fontSize={15}>
                                    Repository
                                </Typography>
                                {this.appState.appInfo?.repository ? (
                                    <Link href={this.appState.appInfo?.repository} target="_blank" variant="body2">
                                        {this.appState.appInfo?.repository}
                                    </Link>
                                ) : (
                                    <Typography variant="body2">Not provided</Typography>
                                )}
                                <Typography
                                    variant="h6"
                                    fontWeight={700}
                                    fontSize={15}
                                    mt={2}
                                    pt={2}
                                    sx={{
                                        borderTop: 1,
                                        borderTopColor: "divider",
                                    }}
                                >
                                    Homepage
                                </Typography>
                                {this.appState.appInfo?.homepage ? (
                                    <Link href={this.appState.appInfo?.homepage} target="_blank" variant="body2">
                                        {this.appState.appInfo?.homepage}
                                    </Link>
                                ) : (
                                    <Typography variant="body2">Not provided</Typography>
                                )}
                                <Typography
                                    variant="h6"
                                    fontWeight={700}
                                    fontSize={15}
                                    mt={2}
                                    pt={2}
                                    sx={{
                                        borderTop: 1,
                                        borderTopColor: "divider",
                                    }}
                                >
                                    README.md
                                </Typography>
                                {this.appState.appInfo?.readme ? (
                                    <Link href={this.appState.appInfo?.readme} target="_blank" variant="body2">
                                        {this.appState.appInfo?.readme}
                                    </Link>
                                ) : (
                                    <Typography variant="body2">Not provided</Typography>
                                )}
                                <Typography
                                    variant="h6"
                                    fontWeight={700}
                                    fontSize={15}
                                    mt={2}
                                    py={2}
                                    sx={{
                                        borderTop: 1,
                                        borderTopColor: "divider",
                                    }}
                                >
                                    Author
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Avatar src="./logo192.png" />
                                    <Typography variant="body2" component={Link}>
                                        {this.appState.appInfo?.owner.author || "Anonymous Author"}
                                    </Typography>
                                </Stack>
                                <Typography
                                    variant="h6"
                                    fontWeight={700}
                                    fontSize={15}
                                    mt={2}
                                    py={2}
                                    sx={{
                                        borderTop: 1,
                                        borderTopColor: "divider",
                                    }}
                                >
                                    Table of Contents
                                </Typography>
                                <Stack spacing={1}>
                                    <Link href="#description" variant="body2">
                                        Description
                                    </Link>
                                    <Link href="#pricing" variant="body2">
                                        Pricing
                                    </Link>
                                    <Link href="#readme" variant="body2">
                                        README.md
                                    </Link>
                                    <Link href="#endpoints" variant="body2">
                                        Endpoints
                                    </Link>
                                </Stack>
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
                <DocumentationDialog parent={this} />
            </SiteLayout>
        );
    }
}

export const AppDetailPage = connect<_Props, {}, {}, RootAppState>((rootAppState: RootAppState) => ({
    appState: rootAppState.appDetail,
}))(_AppDetailPage);
