import { OpenInNew } from "@mui/icons-material";
import { Avatar, Box, Button, Container, Divider, Grid, Link, Paper, Skeleton, Stack, Typography } from "@mui/material";
import "highlight.js/styles/github.css";
import React from "react";
import ReactMarkdown from "react-markdown";
import type { PluggableList } from "react-markdown/lib/react-markdown";
import { connect } from "react-redux";
import Terminal, { ColorMode, TerminalInput } from "react-terminal-ui";
import rehypeHighlight from "rehype-highlight";
import rehypeRemoveComments from "rehype-remove-comments";
import remarkGfm from "remark-gfm";
import remarkGithub from "remark-github";
import { AppContext, ReactAppContextType } from "../AppContext";
import { SiteLayout } from "../SiteLayout";
import { AppDetailEndpointFragment, AppDetailPricingFragment } from "../__generated__/gql/graphql";
import { AppDetailEvent } from "../events/AppDetailEvent";
import { AppDetailPageParams, RouteURL } from "../routes";
import {
  DocumentationDialog,
  SupportDocumentation,
  openDocumentationDialog,
  supportDocumenationDefault,
} from "../stateless-components/DocumentationDialog";
import { PricingCard } from "../stateless-components/PricingCard";
import { AppDetailAppState } from "../states/AppDetailAppState";
import { RootAppState } from "../states/RootAppState";
import { appStore, reduxStore } from "../store-config";

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

  static isLoading(): boolean {
    const { loadingAppInfo, loadingEndpoints, loadingPricing } = appStore.getState().appDetail;
    return loadingAppInfo || loadingEndpoints || loadingPricing;
  }

  static async fetchData(context: AppContext, { app }: AppDetailPageParams, query: {}): Promise<void> {
    return new Promise<void>((resolve) => {
      appStore.dispatch(
        new AppDetailEvent.LoadAppInfo(context, {
          app,
        })
      );
      appStore.dispatch(
        new AppDetailEvent.LoadEndpoints(context, {
          app,
        })
      );
      appStore.dispatch(
        new AppDetailEvent.LoadPricings(context, {
          app,
        })
      );
      const unsub = reduxStore.subscribe(() => {
        if (!_AppDetailPage.isLoading()) {
          resolve();
          unsub();
          context.loading.setIsLoading(false);
        }
      });
    });
  }

  getPricingList(): (AppDetailPricingFragment | null)[] {
    return this.loading() ? [null, null] : this.appState.pricings;
  }

  get appState(): AppDetailAppState {
    return this.props.appState;
  }

  getAppPK(): string {
    return this._context.route.params["app"]!;
  }

  getAppNameFromUrl(): string {
    const app = this._context.route.params["app"];
    if (!app) {
      throw new Error("App name is missing from url");
    }
    return app;
  }

  async componentDidMount() {
    await _AppDetailPage.fetchData(
      this._context,
      this._context.route.params as AppDetailPageParams,
      this._context.route.query
    );
  }

  loading() {
    return _AppDetailPage.isLoading();
  }

  getEndpoints(): (AppDetailEndpointFragment | null)[] {
    return this.loading() ? new Array(3).fill(null) : this.appState.endpoints;
  }

  renderChangeSubscriptionDocumentation({ plan, app }: { plan: string; app: string }) {
    return (
      <Terminal height="10em" colorMode={ColorMode.Light}>
        <Typography variant="body1">We recommend changing the subscription plan with the cli tool.</Typography>
        <Typography variant="body1" sx={{ mb: 2, fontWeight: 700 }}>
          To subscribe or change to the "{plan}" plan, run the following command:
        </Typography>
        <TerminalInput>{`fastapi subscription sub "${app}" \\\n    --plan "${plan}"`}</TerminalInput>
        <Typography variant="body2" mt={2} gutterBottom>
          For details on switching a subscription plan,{" "}
          <Link href={RouteURL.termsPage({ tag: "pricing" })} target="_blank" color="info.main">
            see the pricing documentation.
          </Link>
        </Typography>
      </Terminal>
    );
  }

  renderPricingSkeleton(idx: number) {
    return (
      <Stack key={idx} spacing={2}>
        <Skeleton variant="rounded" sx={{ borderRadius: 20 }} height="12em" width="100%" />
        <Skeleton variant="rounded" sx={{ borderRadius: 20 }} height="2em" width="40%" />
      </Stack>
    );
  }

  renderAPISkeleton(idx: number) {
    return (
      <Stack key={idx} spacing={1}>
        <Skeleton variant="rounded" sx={{ borderRadius: 20 }} height="1em" width="30%" />
        <Skeleton variant="rounded" sx={{ borderRadius: 20 }} height="1em" width="80%" />
      </Stack>
    );
  }

  renderEndpoint(endpoint: AppDetailEndpointFragment, idx: number) {
    return (
      <Box key={idx}>
        <Stack direction="row" spacing={1}>
          <Typography variant="h6">{endpoint.method}</Typography>
          <code>{endpoint.path}</code>
        </Stack>
        <Typography variant="body2">{endpoint.description || "No description provided for this API."}</Typography>
      </Box>
    );
  }

  renderSidebar() {
    return (
      <Box position={this._context.mediaQuery.md.up ? "sticky" : "static"} top={50}>
        <Typography variant="h6">Repository</Typography>
        {this.loading() ? (
          <Skeleton variant="text" sx={{ width: "50%", height: "1.5em", borderRadius: 5 }} />
        ) : this.appState.appInfo?.repository ? (
          <Link href={this.appState.appInfo?.repository} target="_blank" variant="body2">
            {this.appState.appInfo?.repository}
            <OpenInNew sx={{ height: "0.5em", width: "0.5em", ml: 0.3 }} />
          </Link>
        ) : (
          <Typography variant="body2">Not provided</Typography>
        )}
        <Typography
          variant="h6"
          mt={2}
          pt={2}
          sx={{
            borderTop: 1,
            borderTopColor: "divider",
          }}
        >
          Homepage
        </Typography>

        {this.loading() ? (
          <Skeleton variant="text" sx={{ width: "50%", height: "1.5em", borderRadius: 5 }} />
        ) : this.appState.appInfo?.homepage ? (
          <Link href={this.appState.appInfo?.homepage} target="_blank" variant="body2">
            {this.appState.appInfo?.homepage}
            <OpenInNew sx={{ height: "0.5em", width: "0.5em", ml: 0.3 }} />
          </Link>
        ) : (
          <Typography variant="body2">Not provided</Typography>
        )}
        <Typography
          variant="h6"
          mt={2}
          pt={2}
          sx={{
            borderTop: 1,
            borderTopColor: "divider",
          }}
        >
          README.md
        </Typography>
        {this.loading() ? (
          <Skeleton variant="text" sx={{ width: "50%", height: "1.5em", borderRadius: 5 }} />
        ) : this.appState.appInfo?.readme ? (
          <Link href={this.appState.appInfo?.readme} target="_blank" variant="body2">
            {this.appState.appInfo?.readme}
            <OpenInNew sx={{ height: "0.5em", width: "0.5em", ml: 0.3 }} />
          </Link>
        ) : (
          <Typography variant="body2">Not provided</Typography>
        )}
        <Typography
          variant="h6"
          mt={2}
          py={2}
          sx={{
            borderTop: 1,
            borderTopColor: "divider",
          }}
        >
          Author
        </Typography>
        {this.loading() ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <Skeleton variant="circular" sx={{ width: 40, height: 40 }} />
            {/* <Skeleton variant="rounded" sx={{ width: 100, height: 40, borderRadius: 5 }} /> */}
          </Stack>
        ) : (
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar src="./logo192.png" sx={{ height: 40, width: 40 }} />
            <Typography variant="body1" component={Link}>
              {this.appState.appInfo?.owner.author || "Anonymous"}
            </Typography>
          </Stack>
        )}
        <Typography
          variant="h6"
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
          {this.appState.appReadmeContent && (
            <Link href="#readme" variant="body2">
              README.md
            </Link>
          )}
          <Link href="#endpoints" variant="body2">
            APIs
          </Link>
        </Stack>
      </Box>
    );
  }

  render() {
    return (
      <SiteLayout>
        <Container maxWidth="lg">
          <Grid
            container
            columnSpacing={{
              xs: 0,
              sm: 0,
              md: 5,
            }}
            sx={{ mb: 10 }}
          >
            <Grid item px={5} xs={12} sm={12} md={9}>
              <Stack spacing={5}>
                <Box>
                  <Stack direction="row" spacing={1} mt={5} alignItems="center">
                    {this.loading() ? (
                      // <Skeleton
                      //     variant="rounded"
                      //     sx={{ borderRadius: 20 }}
                      //     height="2em"
                      //     width="30%"
                      // />
                      <React.Fragment>
                        <Typography variant="h3" sx={{ letterSpacing: 10 }}>
                          ...
                        </Typography>
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        <Typography variant="h3" id="description" noWrap maxWidth="20em" component="span">
                          {this.appState?.appInfo?.title || this.appState?.appInfo?.name}
                        </Typography>
                        <Typography variant="body1" noWrap maxWidth="20em" component="span">
                          @{this.appState?.appInfo?.name}
                        </Typography>
                        {/* <Typography variant="body1">1.3.7</Typography>
                                        <Typography variant="body1">Published 10 months ago</Typography> */}
                      </React.Fragment>
                    )}
                  </Stack>
                  <Divider
                    sx={{
                      mt: 1,
                      mb: 3,
                      visibility: this.loading() ? "hidden" : "visible",
                    }}
                  />
                  {this.loading() ? (
                    <Skeleton variant="rounded" sx={{ borderRadius: 20 }} height="5em" width="100%" />
                  ) : (
                    <Typography variant="body1">
                      {this.appState?.appInfo?.description || "The author did not provide a description for this app."}
                    </Typography>
                  )}
                </Box>
                {!this._context.mediaQuery.md.up && this.renderSidebar()}
                <Box>
                  <Typography variant="h4" id="pricing">
                    {/* {this.loading() ? (
                                            <Skeleton variant="rounded" width="4em" height="2em" />
                                        ) : (
                                            "Pricing"
                                        )} */}
                    Pricing
                  </Typography>
                  <Divider
                    sx={{
                      mt: 1,
                      mb: 3,
                      visibility: this.loading() ? "hidden" : "visible",
                    }}
                  />
                  <Grid container spacing={3}>
                    {this.getPricingList().map((pricing, idx) => (
                      <Grid item xs={12} md={6} lg={4.5} xl={4.5} key={idx}>
                        {pricing == null ? (
                          this.renderPricingSkeleton(idx)
                        ) : (
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
                        )}
                      </Grid>
                    ))}
                  </Grid>
                </Box>
                {this.appState.appReadmeContent && (
                  <Box>
                    <Typography variant="h4" id="readme">
                      README.md
                    </Typography>
                    <Divider
                      sx={{
                        mt: 1,
                        mb: 3,
                        visibility: this.loading() ? "hidden" : "visible",
                      }}
                    />

                    <ReactMarkdown
                      children={this.appState.appReadmeContent}
                      components={{
                        a: (props) => <Link {...props} color="primary" />,
                        code: (props) => (
                          <Paper
                            {...props}
                            component="code"
                            elevation={0}
                            sx={{
                              bgcolor: "grey.100",
                              fontSize: "0.8em",
                              px: 0.5,
                              py: 0.25,
                              mx: 0.5,
                            }}
                          />
                        ),
                      }}
                      skipHtml={true}
                      remarkPlugins={(() => {
                        const plugins: PluggableList = [remarkGfm];
                        if (this.appState.appInfo!.repository) {
                          plugins.push([remarkGithub, { repository: this.appState.appInfo!.repository }] as any);
                        }
                        return plugins;
                      })()}
                      rehypePlugins={[rehypeHighlight, rehypeRemoveComments]}
                    />
                  </Box>
                )}
                <Box>
                  <Typography variant="h4" id="endpoints">
                    {/* {this.loading() ? (
                                            <Skeleton variant="rounded" width="4em" height="2em" />
                                        ) : (
                                            "APIs"
                                        )} */}
                    APIs
                  </Typography>
                  <Divider
                    sx={{
                      mt: 1,
                      mb: 3,
                      visibility: this.loading() ? "hidden" : "visible",
                    }}
                  />
                  <Stack spacing={3}>
                    {this.getEndpoints().map((endpoint, idx) =>
                      endpoint == null ? this.renderAPISkeleton(idx) : this.renderEndpoint(endpoint, idx)
                    )}
                  </Stack>
                </Box>
              </Stack>
            </Grid>
            {this._context.mediaQuery.md.up && (
              <Grid item xs={3} my={5}>
                {this.renderSidebar()}
              </Grid>
            )}
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
