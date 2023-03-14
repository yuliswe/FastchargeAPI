import React from "react";
import { Helmet } from "react-helmet-async";
import { connect } from "react-redux";
import { RootAppState } from "../states/RootAppState";
import { AppContext, ReactAppContextType } from "../AppContext";
import { encryptAndSign } from "../graphql-client";
import {
    Button,
    Container,
    Fade,
    Grid,
    Stack,
    Typography,
} from "@mui/material";
import {
    AuthProvider,
    GithubAuthProvider,
    GoogleAuthProvider,
    getAuth,
    User as FirebaseUser,
    signInWithPopup,
    fetchSignInMethodsForEmail,
    OAuthCredential,
    linkWithCredential,
} from "firebase/auth";
import { ReactComponent as GoogleIcon } from "../google.svg";
import { ReactComponent as GithubIcon } from "../github.svg";
import { FirebaseError } from "firebase/app";

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
        let redirectUrl = this._context.route?.query.get("redirect");
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

    getBucketKey(): string | undefined {
        return this._context.route?.query.get("key") || undefined;
    }

    reloginNeeded() {
        return (
            new URLSearchParams(document.location.search).get("relogin") ===
            "true"
        );
    }

    getSignInSuccessUrl(): string {
        let signInSuccessUrl = new URL(window.location.href);
        signInSuccessUrl.searchParams.set("success", "true");
        return signInSuccessUrl.href;
    }

    linkAccounts(user: FirebaseUser, credential: OAuthCredential) {
        return linkWithCredential(user, credential);
    }

    async onLoginSucceed(user: FirebaseUser) {
        if (
            this.pendingLinkAccount &&
            this.pendingLinkAccount.email === user.email
        ) {
            // User could be logging in with a different email
            await this.linkAccounts(user, this.pendingLinkAccount.credential);
        }
        switch (this.behavior) {
            // Redirect to the redirect url after authentication
            case "redirect": {
                let redirect = this.getRedirectUrl();
                if (!redirect) {
                    throw new Error("No redirect url provided");
                }
                this._context.route.navigate(redirect, { state: {} });
                break;
            }
            case "putsecret": {
                let jwtSecret = this.getJWTSecret();
                let jweSecret = this.getJWESecret();
                let key = this.getBucketKey();
                if (!key) {
                    throw new Error("No bucket key provided");
                }
                let idToken = await user.getIdToken(/* forceRefresh */ true);
                let signed = await encryptAndSign(
                    {
                        idToken,
                        refreshToken: user.refreshToken,
                    },
                    {
                        jwtSecret,
                        jweSecret,
                    }
                );

                let bucket = "cli-auth-bucket";
                let endpoint = `https://${bucket}.s3.amazonaws.com/${key}`;
                let response = await fetch(endpoint, {
                    mode: "cors",
                    method: "PUT",
                    headers: {
                        "Content-Type": "text/plain",
                        "x-amz-acl": "public-read-write",
                        "x-amz-storage-class": "STANDARD",
                    },
                    body: signed,
                });
                break;
            }
        }
    }

    async componentDidMount() {
        if (this.reloginNeeded()) {
            // go to a url with only the relogin query param deleted
            await getAuth().signOut();
            this._context.route.updateQuery({
                relogin: undefined,
                success: undefined,
            });
            window.location.reload();
        }

        let user = await this._context.firebase.userPromise;
        if (user) {
            await this.onLoginSucceed(user);
        }
    }

    renderSuccessPage() {
        return (
            <Stack display="flex" mb={30} p={10}>
                <Typography variant="h5" display="flex" fontWeight={500}>
                    Welcome to FastchargeAPI
                </Typography>
                <Typography variant="h5" display="flex" fontWeight={500}>
                    You have successfully signed in.
                </Typography>
                <Typography variant="body1" my={1}>
                    You can close this window.
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
                if (
                    e.code === "auth/account-exists-with-different-credential"
                ) {
                    let email = e.customData?.email as string | undefined;
                    if (!email) {
                        throw new Error(
                            "auth/account-exists-with-different-credential error does not have an email"
                        );
                    }
                    let credential = this.credentialFromError(provider, e);
                    if (!credential) {
                        throw new Error(
                            "auth/account-exists-with-different-credential error does not have a credential"
                        );
                    }
                    this.pendingLinkAccount = { credential, email };
                    const previousProviders = await fetchSignInMethodsForEmail(
                        auth,
                        email
                    );
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
                            throw new Error(
                                `Unsupported provider ${previousProviders[0]}`
                            );
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
        let provider = new GoogleAuthProvider();
        void this.handleSignIn(provider);
    }

    handleGithubSignIn() {
        let provider = new GithubAuthProvider();
        provider.addScope("user:email");
        void this.handleSignIn(provider);
    }

    renderLoginPage() {
        return (
            <Stack display="flex" mb={20} p={10}>
                <Typography variant="h5" display="flex" fontWeight={500}>
                    Welcome to FastchargeAPI
                </Typography>
                <Typography variant="caption" my={1}>
                    Please sign in with a 3rd-party provider:
                </Typography>
                <Stack my={5} spacing={2}>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                            this.handleGoogleSignIn();
                        }}
                        startIcon={<GoogleIcon width={24} height={24} />}
                        sx={{ bgcolor: "white", py: 1 }}
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
                        <Typography
                            variant="body1"
                            color="error"
                            maxWidth={300}
                        >
                            {this.state.errorMessage}
                        </Typography>
                    )}
                </Stack>
            </Stack>
        );
    }

    render() {
        return (
            <React.Fragment>
                <Grid container sx={{ height: "100vh" }}>
                    <Grid
                        item
                        xs={7}
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        bgcolor="primary.main"
                        height="100%"
                        sx={{
                            backgroundImage:
                                "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
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
                                    <Typography
                                        variant="h4"
                                        lineHeight={1.5}
                                        fontFamily="Ubuntu"
                                    >
                                        Focus on solving what's important.
                                    </Typography>
                                </Fade>
                                <Fade
                                    in={true}
                                    style={{
                                        transitionDuration: "2s",
                                    }}
                                >
                                    <Typography
                                        variant="h6"
                                        fontWeight={300}
                                    >
                                        FastchargeAPI will take care of metering
                                        and billing.
                                    </Typography>
                                </Fade>
                            </Stack>
                        </Container>
                    </Grid>
                    <Grid
                        item
                        xs={5}
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                    >
                        {this._context.firebase.user
                            ? this.renderSuccessPage()
                            : this.renderLoginPage()}
                    </Grid>
                </Grid>
            </React.Fragment>
        );
    }
}

export const AuthPage = connect<_Props, {}, {}, RootAppState>(
    (rootAppState: RootAppState) => ({
        homeAppState: rootAppState.home,
    })
)(_AuthPage);
