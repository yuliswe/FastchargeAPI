import React from "react";
import { Helmet } from "react-helmet-async";
import { connect } from "react-redux";
import { RootAppState } from "../states/RootAppState";
import firebase from "firebase/compat/app";
import * as firebaseui from "firebaseui";
import "firebaseui/dist/firebaseui.css";
import { AppContext, ReactAppContextType } from "../AppContext";
import * as jose from "jose";
import { encryptAndSign } from "../graphql-client";

type _State = {};

type _Props = {};

class _AuthPage extends React.Component<_Props, _State> {
    firebaseUIInitialized = false;

    static contextType = ReactAppContextType;

    get _context() {
        return this.context as AppContext;
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

    async componentDidMount() {
        if (this.reloginNeeded()) {
            // go to a url with only the relogin query param deleted
            await firebase.auth().signOut();
            this._context.route.updateQuery({
                relogin: undefined,
                success: undefined,
            });
            window.location.reload();
        }

        let user = await this._context.firebase.userPromise;
        if (user) {
            let idToken = await user.getIdToken(/* forceRefresh */ true);
            console.log(idToken);
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
