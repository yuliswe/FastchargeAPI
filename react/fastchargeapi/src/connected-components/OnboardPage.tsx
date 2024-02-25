import { Box, CircularProgress, Container, Fade, Grid, Stack, Typography } from "@mui/material";
import React from "react";
import { connect } from "react-redux";
import { paymentServiceBaseURL } from "src/env";
import { AppContext, ReactAppContextType } from "../AppContext";
import { fetchWithAuth } from "../fetch";
import { OnboardAppState } from "../states/OnBoardAppState";
import { RootAppState } from "../states/RootAppState";
type _State = {};

type _Props = {
  onboardAppState: OnboardAppState;
};

/**
 * This is simply a page that displays a splash screen while a post request is
 * made to the backend to get a onboard url. The splash screen is needed for a
 * better user experience.
 */
class _Onboard extends React.PureComponent<_Props, _State> {
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
    const parsedUrl = new URL(url);
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
    return (new URLSearchParams(document.location.search).get("behavior") || "stay") as typeof this.behaviorOnSuccess;
  }

  getBackendUrl(): string {
    const url = new URL(`${paymentServiceBaseURL}/get-stripe-onboard-link`);
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
      const redirect = this.getRedirectUrl();
      if (redirect) {
        document.location.href = redirect;
      }
    } else {
      // Otherwise start the onboarding process
      const response = await fetchWithAuth(this._context, this.getBackendUrl(), {
        method: "POST",
      });
      const { location } = (await response.json()) as { location: string };
      document.location.href = location;
    }
  }

  renderSuccessPage() {
    return (
      <Stack justifyContent="center" display="flex">
        <Typography variant="h3" mb={1}>
          Onboarding completed.
        </Typography>
        <Typography variant="body1">Welcome to FastchargeAPI! You can now close this page.</Typography>
      </Stack>
    );
  }

  renderLoadingPage() {
    return (
      <Box>
        <Stack direction="row">
          <Box sx={{ display: "flex", alignItems: "center", minWidth: 60, width: 60 }}>
            <CircularProgress sx={{ width: 50, height: 50 }} />
          </Box>
          <Typography variant="h3" gutterBottom display="flex" alignItems="center">
            Onboarding your account with Stripe.
          </Typography>
        </Stack>
        <Stack direction="row">
          <Box sx={{ minWidth: 60, width: 60 }}></Box>
          <Typography variant="body1" sx={{ display: "flex", alignItems: "center" }}>
            This may take up to a minute. Please wait...
          </Typography>
        </Stack>
      </Box>
    );
  }

  renderOnboardingPage() {
    // return this.renderLoadingPage();
    // return this.renderSuccessPage();
    return this.isSuccess() ? this.renderSuccessPage() : this.renderLoadingPage();
  }

  render() {
    return (
      <React.Fragment>
        <Grid container sx={{ height: "100vh", bgcolor: "background.paper" }}>
          {this._context.mediaQuery.md.up && (
            <Grid
              item
              md={6}
              display="flex"
              justifyContent="center"
              alignItems="center"
              bgcolor="primary.light"
              height="100%"
            >
              <Container maxWidth="md">
                <Stack spacing={5} padding={10} mb={10}>
                  <Fade
                    in={true}
                    style={{
                      transitionDuration: "1s",
                    }}
                  >
                    <Typography variant="h1">Focus on solving what's important.</Typography>
                  </Fade>
                  <Fade
                    in={true}
                    style={{
                      transitionDuration: "2s",
                    }}
                  >
                    <Typography variant="body1">Let us take care of metering and billing.</Typography>
                  </Fade>
                </Stack>
              </Container>
            </Grid>
          )}
          <Grid
            item
            xs={12}
            sm={12}
            md={6}
            lg={6}
            xl={6}
            display="flex"
            justifyContent="center"
            alignItems="center"
            p={10}
            pb={20}
          >
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
