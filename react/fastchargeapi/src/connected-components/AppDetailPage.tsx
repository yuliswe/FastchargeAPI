import React from "react";
import { RootAppState } from "../states/RootAppState";
import { AppDetailAppState } from "../states/AppDetailAppState";
import { connect } from "react-redux";
import {
    Avatar,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Container,
    Divider,
    Grid,
    Link,
    List,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import { SiteLayout } from "../SiteLayout";
import { PricingCard } from "../stateless-components/PricingCard";
import {
    AppDetailEndpoint,
    AppDetailEvent,
    AppDetailPricing,
} from "../events/AppDetailEvent";
import { appStore } from "../store-config";
import { AppContext, ReactAppContextType } from "../AppContext";

type _Props = {
    appState: AppDetailAppState;
};
type _State = {};
class _AppDetailPage extends React.Component<_Props, _State> {
    static contextType = ReactAppContextType;
    get _context() {
        return this.context as AppContext;
    }

    getPricingList(): AppDetailPricing[] {
        return this.appState.pricings;
    }

    get appState(): AppDetailAppState {
        return this.props.appState;
    }

    getAppName(): string {
        return this._context.route.params["app"]!;
    }

    componentDidMount(): void {
        appStore.dispatch(
            new AppDetailEvent.LoadAppInfo(this._context, {
                appName: this.getAppName(),
            })
        );
        appStore.dispatch(
            new AppDetailEvent.LoadEndpoints(this._context, {
                appName: this.getAppName(),
            })
        );

        appStore.dispatch(
            new AppDetailEvent.LoadPricings(this._context, {
                appName: this.getAppName(),
            })
        );
    }

    render() {
        return (
            <SiteLayout>
                <Container maxWidth="xl">
                    <Grid container>
                        <Grid item px={5} xs={9}>
                            <Stack spacing={5}>
                                <Box>
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        mt={5}
                                        mb={1}
                                        alignItems="center"
                                    >
                                        <Typography variant="h6">
                                            {this.appState?.appInfo?.name}
                                        </Typography>
                                        <Typography variant="body1">
                                            1.3.7
                                        </Typography>
                                        <Typography variant="body1">
                                            Published 10 months ago
                                        </Typography>
                                    </Stack>
                                    <Divider sx={{ mb: 3 }} />
                                    <Typography variant="body1">
                                        {this.appState?.appInfo?.description ||
                                            "The author did not provide a description for this app."}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="h6">
                                        Pricing
                                    </Typography>
                                    <Divider sx={{ mb: 3 }} />
                                    <Grid container spacing={3}>
                                        {this.getPricingList().map(
                                            (pricing: AppDetailPricing) => (
                                                <Grid item>
                                                    <PricingCard
                                                        {...pricing}
                                                        actionButton={
                                                            <Button
                                                                variant="outlined"
                                                                color="secondary"
                                                            >
                                                                Subscribe
                                                            </Button>
                                                        }
                                                    />
                                                </Grid>
                                            )
                                        )}
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
                                <Box>
                                    <Typography variant="h6">
                                        Endpoints
                                    </Typography>
                                    <Divider sx={{ mb: 3 }} />
                                    <Stack spacing={2}>
                                        {this.appState?.endpoints?.map(
                                            (endpoint: AppDetailEndpoint) => (
                                                <Box>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                    >
                                                        <Typography
                                                            variant="body1"
                                                            color="secondary.main"
                                                            fontWeight={700}
                                                        >
                                                            {endpoint.method}
                                                        </Typography>
                                                        <code>
                                                            {endpoint.path}
                                                        </code>
                                                    </Stack>
                                                    <Typography variant="body1">
                                                        {endpoint.description ||
                                                            "No description provided."}
                                                    </Typography>
                                                </Box>
                                            )
                                        )}
                                    </Stack>
                                </Box>
                            </Stack>
                        </Grid>
                        <Grid item xs={3} my={5}>
                            <Typography
                                variant="h6"
                                fontWeight={700}
                                fontSize={15}
                            >
                                Repository
                            </Typography>
                            {this.appState.appInfo?.repository ? (
                                <Typography variant="body1" component={Link}>
                                    {this.appState.appInfo?.repository}
                                </Typography>
                            ) : (
                                <Typography variant="caption">
                                    Not provided
                                </Typography>
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
                            {this.appState.appInfo?.repository ? (
                                <Typography variant="body1" component={Link}>
                                    {this.appState.appInfo?.homepage}
                                </Typography>
                            ) : (
                                <Typography variant="caption" color="">
                                    Not provided
                                </Typography>
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
                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                            >
                                <Avatar src="./logo192.png" />
                                <Typography variant="body1" component={Link}>
                                    {this.appState.appInfo?.owner.author}
                                </Typography>
                            </Stack>
                        </Grid>
                    </Grid>
                </Container>
            </SiteLayout>
        );
    }
}

export const AppDetailPage = connect<_Props, {}, {}, RootAppState>(
    (rootAppState: RootAppState) => ({
        appState: rootAppState.appDetail,
    })
)(_AppDetailPage);
