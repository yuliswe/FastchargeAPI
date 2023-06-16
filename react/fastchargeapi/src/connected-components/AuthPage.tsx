import { Button, Container, Fade, Grid, Stack, Typography } from "@mui/material";
import { FirebaseError } from "firebase/app";
import {
    AuthProvider,
    User as FirebaseUser,
    GithubAuthProvider,
    GoogleAuthProvider,
    OAuthCredential,
    fetchSignInMethodsForEmail,
    getAuth,
    linkWithCredential,
    signInWithPopup,
} from "firebase/auth";
import React from "react";
import { connect } from "react-redux";
import { AppContext, ReactAppContextType } from "../AppContext";
import { setRemoteSecret } from "../graphql-client";
import { RootAppState } from "../states/RootAppState";
import { ReactComponent as GithubIcon } from "../svg/github.svg";
import { ReactComponent as GoogleIcon } from "../svg/google.svg";

type _State = {
    errorMessage: string;
};

type _Props = {};

class _AuthPage extends React.Component<_Props, _State> {
    static contextType = ReactAppContextType;
    get _context() {
        return this.context as AppContext;
    }

    constructor(props: _Props) {
        super(props);
        this.state = {
            errorMessage: "",
        };
    }

    getRedirectUrl(): string | null {
        const redirectUrl = this._context.route?.query.get("redirect");
        return redirectUrl;
    }

    get behavior(): "redirect" | "putsecret" | undefined {
        if (this.getRedirectUrl()) {
            return "redirect";
        }
        if (this.getJWTSecret()) {
            return "putsecret";
        }
        return undefined;
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

    getBucketKey(): string | undefined {
        return this._context.route?.query.get("key") || undefined;
    }

    reloginNeeded() {
        return new URLSearchParams(document.location.search).get("relogin") === "true";
    }

    getSignInSuccessUrl(): string {
        const signInSuccessUrl = new URL(window.location.href);
        signInSuccessUrl.searchParams.set("success", "true");
        return signInSuccessUrl.href;
    }

    linkAccounts(user: FirebaseUser, credential: OAuthCredential) {
        return linkWithCredential(user, credential);
    }

    async onLoginSucceed(user: FirebaseUser) {
        if (this.pendingLinkAccount && this.pendingLinkAccount.email === user.email) {
            // User could be logging in with a different email
            await this.linkAccounts(user, this.pendingLinkAccount.credential);
        }
        switch (this.behavior) {
            // Redirect to the redirect url after authentication
            case "redirect": {
                const redirect = this.getRedirectUrl();
                if (!redirect) {
                    throw new Error("No redirect url provided");
                }
                setTimeout(() => {
                    // IDK why there has to be a delay or else the navigate function throws an exception
                    this._context.route.navigate(redirect, { replace: true });
                }, 0);
                break;
            }
            case "putsecret": {
                const key = this.getBucketKey();
                if (!key) {
                    throw new Error("No bucket key provided");
                }
                const idToken = await user.getIdToken(/* forceRefresh */ true);
                await setRemoteSecret(
                    this._context,
                    {
                        key: key,
                        value: {
                            idToken,
                            refreshToken: user.refreshToken,
                        },
                        expireAt: Date.now() + 1000 * 60 * 60 * 24, // 1 day,
                    },
                    {
                        jweSecret: this.getJWESecret(),
                        jwtSecret: this.getJWTSecret(),
                    }
                );
                break;
            }
        }
    }

    async componentDidMount() {
        if (this.reloginNeeded()) {
            // go to a url with only the relogin query param deleted
            await getAuth().signOut();
            this._context.route.updateQuery({
                // use Update to keep other query such as redirect unchanged.
                relogin: undefined,
                success: undefined,
            });
        }

        const user = await this._context.firebase.userPromise;
        if (!user.isAnonymous) {
            await this.onLoginSucceed(user);
        }
    }

    renderSuccessPage() {
        return (
            <Stack display="flex">
                <Typography variant="h3" mb={1} display="flex" textAlign="center">
                    Signed in successfully.
                </Typography>
                <Typography variant="body1" display="flex">
                    Welcome to FastchargeAPI! You can now close this window.
                </Typography>
            </Stack>
        );
    }

    credentialFromError(provider: AuthProvider, e: FirebaseError) {
        if (provider instanceof GithubAuthProvider) {
            return GithubAuthProvider.credentialFromError(e);
        }
        if (provider instanceof GoogleAuthProvider) {
            return GoogleAuthProvider.credentialFromError(e);
        }
        return null;
    }

    public pendingLinkAccount: {
        credential: OAuthCredential;
        email: string;
    } | null = null;

    async handleSignIn(provider: AuthProvider) {
        const auth = getAuth();
        let result;
        try {
            result = await signInWithPopup(auth, provider);
        } catch (e) {
            if (e instanceof FirebaseError) {
                if (e.code === "auth/account-exists-with-different-credential") {
                    const email = e.customData?.email as string | undefined;
                    if (!email) {
                        throw new Error("auth/account-exists-with-different-credential error does not have an email");
                    }
                    const credential = this.credentialFromError(provider, e);
                    if (!credential) {
                        throw new Error(
                            "auth/account-exists-with-different-credential error does not have a credential"
                        );
                    }
                    this.pendingLinkAccount = { credential, email };
                    const previousProviders = await fetchSignInMethodsForEmail(auth, email);
                    switch (previousProviders[0]) {
                        case "google.com":
                            this.setState({
                                errorMessage: `Looks like you have previously signed in using a Google account with the same email address. Please sign in with Google instead, and we will link the two accounts together.`,
                            });
                            break;
                        case "github.com":
                            this.setState({
                                errorMessage: `Looks like you have previously signed in using a Github account with the same email address. Please sign in with Google instead, and we will link the two accounts together`,
                            });
                            break;
                        default:
                            throw new Error(`Unsupported provider ${previousProviders[0]}`);
                    }
                }
                return;
            }
            console.error(e);
            throw e;
        }
        const user = result.user;
        await this.onLoginSucceed(user);
    }

    handleGoogleSignIn() {
        const provider = new GoogleAuthProvider();
        void this.handleSignIn(provider);
    }

    handleGithubSignIn() {
        const provider = new GithubAuthProvider();
        provider.addScope("user:email");
        void this.handleSignIn(provider);
    }

    renderLoginPage() {
        return (
            <Stack display="flex">
                <Typography variant="h3" display="flex" textAlign="center" mb={1}>
                    Welcome to FastchargeAPI
                </Typography>
                <Typography variant="caption" textAlign="center">
                    Please sign in with a 3rd-party authenticator.
                </Typography>
                <Stack my={5} spacing={2}>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                            this.handleGoogleSignIn();
                        }}
                        startIcon={<GoogleIcon width={24} height={24} />}
                        sx={{
                            bgcolor: "white",
                            color: "text.primary",
                            py: 1,
                            borderColor: "grey.200",
                            borderWidth: 1,
                            borderStyle: "solid",
                        }}
                    >
                        Sign in with Google
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                            this.handleGithubSignIn();
                        }}
                        startIcon={<GithubIcon width={24} height={24} />}
                        sx={{ bgcolor: "black", color: "white", py: 1 }}
                    >
                        Sign in with Github
                    </Button>
                    {this.state.errorMessage && (
                        <Typography variant="body1" color="error" maxWidth={300}>
                            {this.state.errorMessage}
                        </Typography>
                    )}
                </Stack>
            </Stack>
        );
    }

    renderPageState() {
        // return this.renderLoginPage();
        // return this.renderSuccessPage();
        return this._context.firebase.isAnonymousUser ? this.renderLoginPage() : this.renderSuccessPage();
    }

    render() {
        return (
            this.reloginNeeded() || (
                <React.Fragment>
                    <Grid container sx={{ height: "100vh", bgcolor: "background.paper" }}>
                        {this._context.mediaQuery.md.up && (
                            <Grid
                                item
                                xs={6}
                                display="flex"
                                justifyContent="center"
                                alignItems="center"
                                bgcolor="primary.main"
                                height="100%"
                                sx={{
                                    bgcolor: "primary.light",
                                }}
                            >
                                <Container maxWidth="md">
                                    <Stack spacing={5} p={10} pb={25}>
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
                                            <Typography variant="body1">
                                                Let us take care of metering and billing.
                                            </Typography>
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
                            p={10}
                            pb={20}
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                        >
                            {this.renderPageState()}
                        </Grid>
                    </Grid>
                </React.Fragment>
            )
        );
    }
}

export const AuthPage = connect<_Props, {}, {}, RootAppState>((rootAppState: RootAppState) => ({
    homeAppState: rootAppState.home,
}))(_AuthPage);
