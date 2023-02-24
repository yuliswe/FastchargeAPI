import React from "react";
import { Helmet } from "react-helmet-async";
import { connect } from "react-redux";
import { RootAppState } from "../states/RootAppState";
import { OnboardAppState } from "../states/OnBoardAppState";
import { CircularProgress, Typography } from "@mui/material";
import { AppContext, ReactAppContextType } from "../AppContext";
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
    getRedirectUrl(): string {
        let url = new URLSearchParams(document.location.search).get(
            "redirect_url"
        );
        if (url && !this.urlIsAllowed(url)) {
            throw new Error("redirect_url must be the same domain.");
        }
        return url || "";
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
        let url = new URL(`${this._context.paymentGatewayHost}/onboard`);
        url.searchParams.append(
            "return_url",
            document.location.href + "?success=true"
        );
        url.searchParams.append("refresh_url", document.location.href);
        return url.href;
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
            const response = await fetch(this.getBackendUrl(), {
                method: "POST",
                mode: "cors",
            });

            const { location } = await response.json();
            document.location.href = location;
        }
    }

    renderSuccessPage() {
        return (
            <Typography>
                Onboarding successful. You can close this page.
            </Typography>
        );
    }

    renderLoadingPage() {
        return (
            <React.Fragment>
                <Typography>
                    Onboarding your account with Stripe. This could take up to a
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
                {this.isSuccess()
                    ? this.renderSuccessPage()
                    : this.renderLoadingPage()}
            </React.Fragment>
        );
    }
}

export const OnboardPage = connect<_Props, {}, {}, RootAppState>(
    (rootAppState: RootAppState) => ({
        onboardAppState: rootAppState.home,
    })
)(_Onboard);
