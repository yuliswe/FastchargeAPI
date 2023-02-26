import React from "react";
import { Helmet } from "react-helmet-async";
import { connect } from "react-redux";
import { RootAppState } from "../states/RootAppState";
import { TopUpAppState } from "../states/TopupAppState";
import { CircularProgress, Typography } from "@mui/material";
import { AppContext, ReactAppContextType } from "../AppContext";
import { ApolloClient, gql, InMemoryCache } from "@apollo/client";
import { gqlClient, setRemoteSecret } from "../graphql-client";
import { v4 as uuid4 } from "uuid";

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
        let parsedUrl = new URL(url);
        return (
            parsedUrl.host === document.location.host ||
            parsedUrl.host === "localhost"
        );
    }

    isSuccess(): boolean {
        return this._context.route.query.get("success") != null;
    }

    isCanceled(): boolean {
        return this._context.route.query.get("cancel") != null;
    }

    getAmountCents(): number {
        return parseInt(this._context.route.query.get("amount_cents") || "0");
    }

    getJWTSecret(): Uint8Array {
        const hexString = this._context.route?.query.get("jwt");
        if (!hexString) {
            throw new Error("jwt is missing from the url");
        }
        const bytes = new Uint8Array(
            hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
        );
        return bytes;
    }

    getJWESecret(): Uint8Array {
        const hexString = this._context.route?.query.get("jwe");
        if (!hexString) {
            throw new Error("jwe is missing from the url");
        }
        const bytes = new Uint8Array(
            hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
        );
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
        let key = this._context.route.query.get("key") || "";
        if (!key) {
            throw new Error("key is missing from the url");
        }
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
    }

    async isLoggedIn() {
        console.log((await this._context.firebase.userPromise) != null);
        return (await this._context.firebase.userPromise) != null;
    }

    /**
     * Specify what happens after the user returns from the Stripe topuping webpage.
     * stay: stays on this page. Shows a success message depending on the value of success.
     * redirect: redirects to the success_url
     */
    get behaviorOnSuccess(): "stay" | "redirect" {
        return (new URLSearchParams(document.location.search).get("behavior") ||
            "stay") as typeof this.behaviorOnSuccess;
    }

    getBackendUrl(): string {
        let url = new URL(`${this._context.paymentGatewayHost}/checkout`);
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
            this._context.route?.navigate({
                pathname: "/auth",
                search: `redirect=${this._context.route.location.pathname}${this._context.route.location.search}`,
            });
        } else {
            // Otherwise start the topuping process
            try {
                const response = await fetch(this.getBackendUrl(), {
                    method: "POST",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        amount_cents: this.getAmountCents(),
                        success_url: this.getSuccessUrl(),
                        cancel_url: this.getCancelUrl(),
                    }),
                });
                let { location } = await response.json();
                document.location.href = location;
            } catch (error) {
                console.error("Error posting to", this.getBackendUrl(), error);
            }
        }
    }

    renderSuccessPage() {
        return (
            <Typography>
                TopUping successful. You can close this page.
            </Typography>
        );
    }

    renderCancelPage() {
        return (
            <Typography>TopUping canceled. You can close this page.</Typography>
        );
    }

    renderLoadingPage() {
        return (
            <React.Fragment>
                <Typography>
                    TopUping your account with Stripe. This could take up to a
                    minute. Please wait.
                </Typography>
                <CircularProgress />
            </React.Fragment>
        );
    }

    render() {
        return (
            <React.Fragment>
                <Helmet>
                    <script
                        src="https://accounts.google.com/gsi/client"
                        async
                        defer
                    ></script>
                </Helmet>
                {this.isSuccess() && this.renderSuccessPage()}
                {this.isCanceled() && this.renderCancelPage()}
                {!this.isSuccess() &&
                    !this.isCanceled() &&
                    this.renderLoadingPage()}
            </React.Fragment>
        );
    }
}

export const TopUpPage = connect<_Props, {}, {}, RootAppState>(
    (rootAppState: RootAppState) => ({
        topupAppState: rootAppState.home,
    })
)(_TopUp);
