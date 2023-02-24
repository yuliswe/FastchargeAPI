import React from "react";
import { Helmet } from "react-helmet-async";
import { connect } from "react-redux";
import { RootAppState } from "../states/RootAppState";
import { TopUpAppState } from "../states/TopupAppState";
import { CircularProgress, Typography } from "@mui/material";
import { AppContext, ReactAppContextType } from "../AppContext";
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
        let url = new URLSearchParams(document.location.search).get(
            "success_url"
        );
        if (url && !this.urlIsAllowed(url)) {
            throw new Error("success_url must be the same domain.");
        }
        if (url) {
            return url;
        }
        let defaultUrl = new URL(document.location.href);
        for (let key of defaultUrl.searchParams.keys()) {
            defaultUrl.searchParams.delete(key);
        }
        defaultUrl.searchParams.set("success", "true");
        return defaultUrl.href;
    }
    getCancelUrl(): string {
        let url = new URLSearchParams(document.location.search).get(
            "cancel_url"
        );
        if (url && !this.urlIsAllowed(url)) {
            throw new Error("cancel_url must be the same domain.");
        }
        if (url) {
            return url;
        }
        let defaultUrl = new URL(document.location.href);
        for (let key of defaultUrl.searchParams.keys()) {
            defaultUrl.searchParams.delete(key);
        }
        defaultUrl.searchParams.set("cancel", "true");
        return defaultUrl.href;
    }
    urlIsAllowed(url: string): boolean {
        let parsedUrl = new URL(url);
        return (
            parsedUrl.host === document.location.host ||
            parsedUrl.host === "localhost"
        );
    }
    isSuccess(): boolean {
        return (
            new URLSearchParams(document.location.search).get("success") != null
        );
    }
    isCanceled(): boolean {
        return (
            new URLSearchParams(document.location.search).get("cancel") != null
        );
    }
    getAmountCents(): number {
        return parseInt(
            new URLSearchParams(document.location.search).get("amount_cents") ||
                "0"
        );
    }

    /**
     * Used for interaction with the cli. Post the payment result to this url.
     */
    getPostResultUrl(): string {
        return (
            new URLSearchParams(document.location.search).get("post_result") ||
            ""
        );
    }

    /**
     * Used for interaction with the cli. Post the payment result to this url.
     * {
     *     status: "success" | "canceled"
     * }
     */
    async postResultToCli() {
        if (this.getPostResultUrl()) {
            try {
                const response = await fetch(this.getPostResultUrl(), {
                    method: "POST",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        status: this.isSuccess() ? "success" : "canceled",
                    }),
                });
            } catch (error) {
                console.error(
                    "Error posting to",
                    this.getPostResultUrl(),
                    error
                );
            }
        }
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
            this.postResultToCli();
        } else if (this.isCanceled()) {
            this.postResultToCli();
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
