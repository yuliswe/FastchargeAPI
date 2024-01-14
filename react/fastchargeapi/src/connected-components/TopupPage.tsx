import DoneIcon from "@mui/icons-material/Done";
import { Box, CircularProgress, Container, Fade, Grid, Stack, Typography } from "@mui/material";
import React from "react";
import { connect } from "react-redux";
import { AppContext, ReactAppContextType } from "../AppContext";
import { fetchWithAuth } from "../fetch";
import { setRemoteSecret } from "../graphql-client";
import { RouteURL } from "../routes";
import { paymentServiceBaseURL } from "../runtime";
import { RootAppState } from "../states/RootAppState";
import { TopUpAppState } from "../states/TopupAppState";
type _State = {};

type _Props = {
  topupAppState: TopUpAppState;
};

/**
 * This is simply a page that displays a splash screen while a post request is
 * made to the backend to get a topup url. The splash screen is needed for a
 * better user experience.
 */
class _TopUp extends React.Component<_Props, _State> {
  static contextType = ReactAppContextType;
  get _context() {
    return this.context as AppContext;
  }
  /**
   * Redirect to this url when the user returns from the Stripe checkout
   * session webpage. It must be the same host or localhost. If left empty,
   * then upon succesful authentication, the page will be redirected to itself
   * with ?success=true query param.
   */
  getSuccessUrl(): string {
    return (
      document.location.origin +
      this._context.route.location.pathname +
      this._context.route.location.search +
      "&success=true"
    );
  }

  /**
   * Redirect to this url when the user cancels the Stripe checkout session.
   * Similar to getSuccessUrl().
   * @returns
   */
  getCancelUrl(): string {
    return (
      document.location.origin +
      this._context.route.location.pathname +
      this._context.route.location.search +
      "&cancel=true"
    );
  }

  urlIsAllowed(url: string): boolean {
    const parsedUrl = new URL(url);
    return parsedUrl.host === document.location.host || parsedUrl.host === "localhost";
  }

  isSuccess(): boolean {
    return this._context.route.query.get("success") != null;
  }

  isCanceled(): boolean {
    return this._context.route.query.get("cancel") != null;
  }

  getAmount(): string {
    return this._context.route.query.get("amount") || "0";
  }

  getJWTSecret(): Uint8Array {
    const hexString = this._context.route?.query.get("jwt");
    if (!hexString) {
      throw new Error("jwt is missing from the url");
    }
    const bytes = new Uint8Array(hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
    return bytes;
  }

  getJWESecret(): Uint8Array {
    const hexString = this._context.route?.query.get("jwe");
    if (!hexString) {
      throw new Error("jwe is missing from the url");
    }
    const bytes = new Uint8Array(hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
    return bytes;
  }

  /**
   * Used for interaction with the cli. Post the payment result to this url,
   * by putting secret containing the status of the reuqest.
   *
   * {
   *     status: "success" | "canceled"
   * }
   */
  async postResultToCli() {
    const key = this._context.route.query.get("key") || "";
    if (!key) {
      throw new Error("key is missing from the url");
    }
    try {
      const response = await setRemoteSecret(
        this._context,
        {
          key: key,
          value: {
            status: this.isSuccess() ? "success" : "canceled",
          },
          expireAt: Date.now() + 1000 * 60 * 60 * 24, // 1 day,
        },
        {
          jweSecret: this.getJWESecret(),
          jwtSecret: this.getJWTSecret(),
        }
      );
    } catch (e) {
      console.error(e);
    }
  }

  async isLoggedIn() {
    return !(await this._context.firebase.isAnonymousUserPromise);
  }

  /**
   * Specify what happens after the user returns from the Stripe topuping webpage.
   * stay: stays on this page. Shows a success message depending on the value of success.
   * redirect: redirects to the success_url
   */
  get behaviorOnSuccess(): "stay" | "redirect" {
    return (new URLSearchParams(document.location.search).get("behavior") || "stay") as typeof this.behaviorOnSuccess;
  }

  getBackendUrl(): string {
    const url = new URL(`${paymentServiceBaseURL}/get-stripe-checkout-link`);
    return url.href;
  }

  constructor(props: _Props) {
    super(props);
    this.state = {};
  }

  async componentDidMount() {
    // If the user is already topuped, then redirect to the success_url
    if (this.isSuccess()) {
      await this.postResultToCli();
    } else if (this.isCanceled()) {
      await this.postResultToCli();
    } else if (!(await this.isLoggedIn())) {
      // redirect to the login path, and when successful, redirect back to this page
      this._context.route?.navigate(
        RouteURL.authPage({
          query: {
            redirect: `redirect=${this._context.route.location.pathname}${this._context.route.location.search}`,
          },
        }),
        { replace: true }
      );
    } else {
      // Otherwise start the topuping process
      try {
        const response = await fetchWithAuth(this._context, this.getBackendUrl(), {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: this.getAmount(),
            successUrl: this.getSuccessUrl(),
            cancelUrl: this.getCancelUrl(),
          }),
        });
        const { location } = await response.json();
        document.location.href = location;
        if (!location) {
          throw new Error("location is missing from the response");
        }
      } catch (error) {
        console.error("Error posting to", this.getBackendUrl(), error);
      }
    }
  }

  renderSuccessPage() {
    return (
      <Box>
        <Stack direction="row">
          <Box sx={{ display: "flex", alignItems: "center", minWidth: 60, width: 60 }}>
            <DoneIcon sx={{ width: 50, height: 50 }} color="success" />
          </Box>
          <Typography variant="h3" gutterBottom display="flex" alignItems="center">
            Top-up succeeded. Thank you!
          </Typography>
        </Stack>
        <Stack direction="row">
          <Box sx={{ minWidth: 60, width: 60 }}></Box>
          <Typography variant="body1" sx={{ display: "flex", alignItems: "center" }}>
            The fund will appear in your account shortly. You can now close this page.
          </Typography>
        </Stack>
      </Box>
    );
  }

  renderCancelPage() {
    return (
      <Box>
        <Stack direction="row">
          <Typography variant="h3" gutterBottom display="flex" alignItems="center">
            Top-up was canceled.
          </Typography>
        </Stack>
        <Stack direction="row">
          <Typography variant="body1" sx={{ display: "flex", alignItems: "center" }}>
            You can now close this page.
          </Typography>
        </Stack>
      </Box>
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
            Creating an order with Stripe...
          </Typography>
        </Stack>
        <Stack direction="row">
          <Box sx={{ minWidth: 60, width: 60 }}></Box>
          <Typography variant="body1" sx={{ display: "flex", alignItems: "center" }}>
            Please wait.
          </Typography>
        </Stack>
      </Box>
    );
  }

  renderPageContent() {
    if (this.isSuccess()) {
      return this.renderSuccessPage();
    }
    if (this.isCanceled()) {
      return this.renderCancelPage();
    }
    return this.renderLoadingPage();
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
            {this.renderPageContent()}
          </Grid>
        </Grid>
      </React.Fragment>
    );
  }
}

export const TopUpPage = connect<_Props, {}, {}, RootAppState>((rootAppState: RootAppState) => ({
  topupAppState: rootAppState.home,
}))(_TopUp);
