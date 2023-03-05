import React from "react";
import { RootAppState } from "../states/RootAppState";
import { connect } from "react-redux";
import { TermsAppState } from "../states/TermsAppState";
import { SiteLayout } from "../SiteLayout";
import { Box, Container, Grid, Stack, Typography } from "@mui/material";

type _State = {};

type _Props = {
    appState: TermsAppState;
};

class _TermsPage extends React.Component<_Props, _State> {
    constructor(props: _Props) {
        super(props);
        this.state = {};
    }
    render(): React.ReactNode {
        return (
            <SiteLayout>
                <Container maxWidth="lg" sx={{ my: 10 }}>
                    <Grid container rowSpacing={10} columnSpacing={10}>
                        <Grid item xs={6}>
                            <Typography
                                id="#pricing"
                                variant="h4"
                                display="flex"
                                flexDirection="row-reverse"
                            >
                                Pricing
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Stack spacing={3}>
                                <Typography variant="h5" gutterBottom>
                                    Using APIs published on FastchargeAPI
                                </Typography>
                                <Box>
                                    <Typography
                                        variant="body1"
                                        fontWeight={700}
                                        gutterBottom
                                    >
                                        Per-request fee & Monthly fee
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        When using an API that's published on
                                        FastchargeAPI, you pay the API publisher
                                        on a per-request basis. There might be a
                                        monthly fee that you pay to the API
                                        publisher while actively using their
                                        APIs. You only pay the monthly fee when
                                        the first request is made in every 30
                                        days. In other words, if you don't make
                                        a request in 30 days, you are not
                                        charged the monthly fee, even if you are
                                        subscribed to an app.
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography
                                        variant="body1"
                                        fontWeight={700}
                                        gutterBottom
                                    >
                                        Free quota
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        Some API publishers may allow free quota
                                        so that you can try their APIs without
                                        paying. The free quota is per app and
                                        per account, and it does not reset
                                        monthly. Each request consumes 1 free
                                        quota. You won't be charged for the
                                        monthly fee when the free quota is used.
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography
                                        variant="body1"
                                        fontWeight={700}
                                        gutterBottom
                                    >
                                        Subscription
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        You must subcribe to a pricing plan of
                                        an app before using its APIs, including
                                        the free quota. If you are subscribed to
                                        an app and actively using it, and later
                                        switch to a subscription that has a
                                        higher monthly fee, you will be charged
                                        the difference between the two monthly
                                        fees for that active month. On the other
                                        hand, if you switch from a pricing plan
                                        that has a higher monthly fee to a
                                        pricing plan that has a lower monthly
                                        fee, the difference is not refunded. In
                                        both cases, the per-request fee on the
                                        new pricing plan is applied immediately.
                                        If you unsubscribe from an app, the
                                        monthly fee is not refunded if already
                                        paid. If you re-subscribe to the same
                                        plan during the same active month, that
                                        is, within 30 days from when the first
                                        request is billed the previous monthly
                                        fee, you won't be charged the monthly
                                        fee again. If you re-subscribe to a
                                        different plan, then it will be the same
                                        as if you are switching the plans.
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography
                                        variant="body1"
                                        fontWeight={700}
                                        gutterBottom
                                    >
                                        Account
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        All fees associated to API usage are
                                        charge on your FastchargeAPI account.
                                        You must have maintain a positive
                                        account balance in order to use APIs. If
                                        your account balance is below zero,
                                        request to any API will be rejected. You
                                        can top up your account at any time.{" "}
                                        <b>
                                            The balance on your account is not
                                            refundable.{" "}
                                        </b>
                                        You can, however, withdraw money from
                                        your account to your Stripe account. But
                                        keep in mind, doing so will incur a fee
                                        that's charged by Stripe. To find out
                                        more about this, see the pricing
                                        description for API publishers.
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography
                                        variant="body1"
                                        fontWeight={700}
                                        gutterBottom
                                    >
                                        Refund
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        <b>
                                            The balance on your account is not
                                            refundable.{" "}
                                        </b>
                                        If you are dissatisfied with our
                                        services, or having trouble using an API
                                        you have paid the monthy fee for, please
                                        reach out to us and we will try to help
                                        you.
                                    </Typography>
                                </Box>

                                <Typography variant="h5" gutterBottom>
                                    Publish your own APIs on FastchargeAPI
                                </Typography>
                                <Box>
                                    <Typography
                                        variant="body1"
                                        fontWeight={700}
                                        gutterBottom
                                    >
                                        Protection
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        Our pricing model is designed to protect
                                        you from unexpected bill and customer
                                        charge backs, by requiring the customer
                                        to maintain an account balance
                                    </Typography>
                                </Box>
                            </Stack>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography
                                id="#privacy"
                                variant="h4"
                                display="flex"
                                flexDirection="row-reverse"
                            >
                                Privacy
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body1">XXX</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography
                                id="#tos"
                                variant="h4"
                                display="flex"
                                flexDirection="row-reverse"
                            >
                                Terms of Services
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body1">XXX</Typography>
                        </Grid>
                    </Grid>
                </Container>
            </SiteLayout>
        );
    }
}

export const TermsPage = connect<_Props, {}, {}, RootAppState>(
    (rootAppState: RootAppState) => ({
        appState: rootAppState.terms,
    })
)(_TermsPage);
