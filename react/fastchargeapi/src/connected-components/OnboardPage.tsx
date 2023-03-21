import React from "react";
import { connect } from "react-redux";
import { RootAppState } from "../states/RootAppState";
import { OnboardAppState } from "../states/OnBoardAppState";
import { CircularProgress, Container, Fade, Grid, Stack, Typography } from "@mui/material";
import { AppContext, ReactAppContextType } from "../AppContext";
import { fetchWithAuth } from "../fetch";
type _State = {};

type _Props = {
    onboardAppState: OnboardAppState;
};

/**
 * This is simply a page that displays a splash screen while a post request is
 * made to the backend to get a onboard url. The splash screen is needed for a
 * better user experience.
 */
class _Onboard extends React.Component<_Props, _State> {
    static contextType = ReactAppContextType;
    get _context() {
        return this.context as AppContext;
    }
    /**
     * Redirect to this url when the user returns from the Stripe onboard
     * webpage. It must be the same host or localhost. If left empty, then upon
     * succesful authentication, the page will be redirected to itself with
     * ?success=true query param.
     */
    getRedirectUrl(): string | null {
        return this._context.route.query.get("redirect_url");
    }

    urlIsAllowed(url: string): boolean {
        let parsedUrl = new URL(url);
        return parsedUrl.host === document.location.host || parsedUrl.host === "localhost";
    }

    isSuccess(): boolean {
        return new URLSearchParams(document.location.search).get("success") != null;
    }

    /**
     * Specify what happens after the user returns from the Stripe onboarding webpage.
     * stay: stays on this page. Shows a success message depending on the value of success.
     * redirect: redirects to the redirect_url
     */
    get behaviorOnSuccess(): "stay" | "redirect" {
        return (new URLSearchParams(document.location.search).get("behavior") ||
            "stay") as typeof this.behaviorOnSuccess;
    }

    getBackendUrl(): string {
        let url = new URL("https://api.v2.payment.fastchargeapi.com/get-stripe-onboard-link");
        url.searchParams.append("return_url", document.location.href + "?success=true");
        url.searchParams.append("refresh_url", document.location.href);
        return url.href;
    }

    /**
     * Used for interaction with the cli. Post the payment result to this url.
     */
    getPostResultUrl(): string {
        return new URLSearchParams(document.location.search).get("post_result") || "";
    }

    /**
     * Used for interaction with the cli. Post the payment result to this url.
     * {
     *     status: "success" | "canceled"
     * }
     */
    async postResultToCli() {
        if (this.getPostResultUrl()) {
            await fetch(this.getPostResultUrl(), {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: this.isSuccess() ? "success" : "canceled",
                }),
            });
        }
    }

    constructor(props: _Props) {
        super(props);
        this.state = {};
    }

    async componentDidMount() {
        // If the user is already onboarded, then redirect to the redirect_url
        if (this.isSuccess()) {
            if (this.getPostResultUrl()) {
                await this.postResultToCli();
            }
            let redirect = this.getRedirectUrl();
            if (redirect) {
                document.location.href = redirect;
            }
        } else {
            // Otherwise start the onboarding process
            const response = await fetchWithAuth(this._context, this.getBackendUrl(), {
                method: "POST",
            });
            const { location } = await response.json();
            document.location.href = location;
        }
    }

    renderSuccessPage() {
        return (
            <Stack justifyContent="center" display="flex" mb={30}>
                <Typography variant="h5" fontWeight={500} gutterBottom>
                    Welcome to FastchargeAPI!
                </Typography>
                <Typography variant="body1">
                    Onboarding has completed. You can revisit this page any time to change the information.
                </Typography>
                <Typography variant="body1">You can now close this page.</Typography>
            </Stack>
        );
    }

    renderLoadingPage() {
        return (
            <Stack justifyContent="center" display="flex" mb={30}>
                <Typography variant="h5" fontWeight={500} gutterBottom display="flex" alignItems="center">
                    <CircularProgress sx={{ mr: 2 }} />
                    Onboarding your account with Stripe.
                </Typography>
                <Typography variant="body1" sx={{ ml: 7.3 }}>
                    This could take up to a minute. Please wait...
                </Typography>
            </Stack>
        );
    }

    renderOnboardingPage() {
        return this.isSuccess() ? this.renderSuccessPage() : this.renderLoadingPage();
    }

    render() {
        return (
            <React.Fragment>
                <Grid container sx={{ height: "100vh" }}>
                    <Grid
                        item
                        xs={5}
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        bgcolor="primary.main"
                        height="100%"
                        sx={{
                            backgroundImage: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
                        }}
                    >
                        <Container maxWidth="md">
                            <Stack spacing={5} padding={10} mb={30}>
                                <Fade
                                    in={true}
                                    style={{
                                        transitionDuration: "1s",
                                    }}
                                >
                                    <Typography variant="h4" lineHeight={1.5} fontFamily="Ubuntu">
                                        Focus on solving what's important.
                                    </Typography>
                                </Fade>
                                <Fade
                                    in={true}
                                    style={{
                                        transitionDuration: "2s",
                                    }}
                                >
                                    <Typography variant="h6" fontWeight={300}>
                                        FastchargeAPI will take care of metering and billing.
                                    </Typography>
                                </Fade>
                            </Stack>
                        </Container>
                    </Grid>
                    <Grid item xs={7} display="flex" justifyContent="center" alignItems="center">
                        {this.renderOnboardingPage()}
                    </Grid>
                </Grid>
            </React.Fragment>
        );
    }
}

export const OnboardPage = connect<_Props, {}, {}, RootAppState>((rootAppState: RootAppState) => ({
    onboardAppState: rootAppState.home,
}))(_Onboard);
