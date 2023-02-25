import React from "react";
import { Helmet } from "react-helmet-async";
import { connect } from "react-redux";
import { RootAppState } from "../states/RootAppState";
import firebase from "firebase/compat/app";
import * as firebaseui from "firebaseui";
import "firebaseui/dist/firebaseui.css";
import { AppContext, ReactAppContextType } from "../AppContext";
import * as jose from "jose";

type _State = {};

type _Props = {};

class _AuthPage extends React.Component<_Props, _State> {
    firebaseUIInitialized = false;

    static contextType = ReactAppContextType;

    get _context() {
        return this.context as AppContext;
    }
    /**
     * Redirect Url is where the user's id token and refresh token will be
     * sent to. It must be the same host or localhost. If left empty, then
     * upon succesful authentication, the page will be redirected to itself
     * with ?success=true query param.
     */
    getRedirectUrl(): string {
        let redirectUrl =
            new URLSearchParams(document.location.search).get("redirect") || "";
        if (!redirectUrl) {
            return document.location.href + "?success=true";
        }
        let url = new URL(redirectUrl);
        if (
            url.hostname !== window.location.hostname &&
            url.hostname !== "localhost"
        ) {
            throw Error(
                "Redirect URL must be the same host or localhost: " +
                    redirectUrl
            );
        }
        return url.href;
    }

    get behavior(): "redirect" | "postandclose" | "putsecret" {
        return (new URLSearchParams(document.location.search).get("behavior") ||
            "redirect") as typeof this.behavior;
    }

    getJWTSecret(): Uint8Array | undefined {
        const hexString = this._context.route?.query.get("jwt") || undefined;
        if (!hexString) {
            return undefined;
        }
        const bytes = new Uint8Array(
            hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
        );
        return bytes;
    }

    getJWESecret(): Uint8Array | undefined {
        const hexString = this._context.route?.query.get("jwe") || undefined;
        if (!hexString) {
            return undefined;
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

    async componentDidMount() {
        if (this.reloginNeeded()) {
            // go to a url with only the relogin query param deleted
            await firebase.auth().signOut();
            this._context.route!.updateQuery({
                relogin: undefined,
                success: undefined,
            });
            window.location.reload();
        }

        let user = await this._context.firebase.userPromise;
        console.log(user);
        // firebase.auth().onAuthStateChanged(
        //     async (user) => {
        if (user) {
            //             // user is signed in
            //             this.setState({ user });
            let idToken = await user.getIdToken(/* forceRefresh */ true);
            console.log(idToken);
            let redirect = this.getRedirectUrl();
            switch (this.behavior) {
                case "postandclose": {
                    if (redirect && this.behavior === "postandclose") {
                        try {
                            await fetch(redirect, {
                                method: "POST",
                                mode: "cors",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    idToken,
                                    refreshToken: user.refreshToken,
                                }),
                            });
                        } catch {
                            console.error("Failed to post:", redirect);
                        } finally {
                            if (this.behavior === "postandclose") {
                                window.close();
                            }
                        }
                    }
                    break;
                }
                case "putsecret": {
                    console.log(this._context);
                    let jwtSecret = this.getJWTSecret();
                    if (!jwtSecret) {
                        throw new Error("No secret provided");
                    }
                    let jweSecret = this.getJWESecret();
                    if (!jweSecret) {
                        throw new Error("No secret provided");
                    }
                    let key = this.getBucketKey();
                    if (!key) {
                        throw new Error("No bucket key provided");
                    }
                    let encrypted = await new jose.EncryptJWT({
                        idToken,
                        refreshToken: user.refreshToken,
                    })
                        .setIssuedAt()
                        .setIssuer("fastchargeapi.com")
                        .setAudience("fastchargeapi.com")
                        .setProtectedHeader({
                            alg: "dir",
                            enc: "A256CBC-HS512",
                        })
                        .encrypt(jweSecret);

                    let signed = await new jose.SignJWT({
                        encrypted,
                    })
                        .setProtectedHeader({
                            alg: "HS512",
                        })
                        .sign(jwtSecret);

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
                    console.log("encrypted & signed:", signed);
                    console.log(response);
                    break;
                }
            }

            let displayName = user.displayName;
            let email = user.email;
            let emailVerified = user.emailVerified;
            let photoURL = user.photoURL;
            let uid = user.uid;
            let phoneNumber = user.phoneNumber;
            let providerData = user.providerData;
            //   user.getIdToken().then(function(accessToken) {
            //     document.getElementById('sign-in-status').textContent = 'Signed in';
            //     document.getElementById('sign-in').textContent = 'Sign out';
            //     document.getElementById('account-details').textContent = JSON.stringify({
            //       displayName: displayName,
            //       email: email,
            //       emailVerified: emailVerified,
            //       phoneNumber: phoneNumber,
            //       photoURL: photoURL,
            //       uid: uid,
            //       accessToken: accessToken,
            //       providerData: providerData
            //     }, null, '  ');
            //   });
        } else if (!this.firebaseUIInitialized) {
            this.firebaseUIInitialized = true;
            let ui =
                firebaseui.auth.AuthUI.getInstance() ||
                new firebaseui.auth.AuthUI(firebase.auth());
            // The start method will wait until the DOM is loaded.

            let uiConfig = {
                signInFlow: "popup",
                signInSuccessUrl: this.getSignInSuccessUrl(),
                signInOptions: [
                    // Leave the lines as is for the providers you want to offer your users.
                    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
                    // firebase.auth.FacebookAuthProvider.PROVIDER_ID,
                    // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
                    // firebase.auth.GithubAuthProvider.PROVIDER_ID,
                    // firebase.auth.EmailAuthProvider.PROVIDER_ID,
                    // firebase.auth.PhoneAuthProvider.PROVIDER_ID,
                    // firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID,
                ],
                // tosUrl and privacyPolicyUrl accept either url string or a callback
                // function.
                // Terms of service url/callback.
                // Privacy policy url/callback.
                // tosUrl: '<your-tos-url>',
                // privacyPolicyUrl: function () {
                //     window.location.assign('<your-privacy-policy-url>');
                // }
            };

            ui.start("#firebaseui-auth-container", uiConfig);
        }
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

                {this._context.firebase.user ? (
                    "Success. You can close this window."
                ) : (
                    <div id="firebaseui-auth-container"></div>
                )}
            </React.Fragment>
        );
    }
}

export const AuthPage = connect<_Props, {}, {}, RootAppState>(
    (rootAppState: RootAppState) => ({
        homeAppState: rootAppState.home,
    })
)(_AuthPage);
