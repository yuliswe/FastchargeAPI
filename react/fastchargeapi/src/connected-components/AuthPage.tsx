import React from "react";
import { Helmet } from "react-helmet-async";
import { connect } from "react-redux";
import { RootAppState } from "../states/RootAppState";
import firebase from "firebase/compat/app";
import * as firebaseui from "firebaseui";
import "firebaseui/dist/firebaseui.css";

type _State = {
    user: firebase.User | null;
};

type _Props = {};

declare global {
    interface Window {
        handleCredentialResponse: (response: any) => void;
    }
}

class _AuthPage extends React.Component<_Props, _State> {
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

    get behavior(): "redirect" | "postandclose" {
        return (new URLSearchParams(document.location.search).get("behavior") ||
            "redirect") as typeof this.behavior;
    }

    reloginNeeded() {
        return (
            new URLSearchParams(document.location.search).get("relogin") ===
            "true"
        );
    }

    constructor(props: _Props) {
        super(props);
        this.state = {
            user: null,
        };
    }

    componentDidUpdate(
        prevProps: Readonly<_Props>,
        prevState: Readonly<_State>,
        snapshot?: any
    ): void {}

    async componentDidMount() {
        // const firebaseConfig = {
        //     apiKey: "AIzaSyAtSOzX-i3gzBYULHltD4Xkz-H9_9U6tD8",
        //     authDomain: "fastchargeapi.firebaseapp.com", // https://cloud.google.com/identity-platform/docs/show-custom-domain
        //     projectId: "fastchargeapi",
        //     storageBucket: "fastchargeapi.appspot.com",
        //     messagingSenderId: "398384724830",
        //     appId: "1:398384724830:web:b20ccb2c0662b16e0eadcf",
        //     measurementId: "G-8BJ3Q22YR1",
        // };

        // let app = firebase.initializeApp(firebaseConfig);

        let signInSuccessUrl = new URL(window.location.href);
        signInSuccessUrl.searchParams.set("success", "true");

        var uiConfig = {
            signInFlow: "popup",
            signInSuccessUrl: signInSuccessUrl.href,
            signInOptions: [
                // Leave the lines as is for the providers you want to offer your users.
                firebase.auth.GoogleAuthProvider.PROVIDER_ID,
                firebase.auth.FacebookAuthProvider.PROVIDER_ID,
                firebase.auth.TwitterAuthProvider.PROVIDER_ID,
                firebase.auth.GithubAuthProvider.PROVIDER_ID,
                firebase.auth.EmailAuthProvider.PROVIDER_ID,
                firebase.auth.PhoneAuthProvider.PROVIDER_ID,
                firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID,
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

        // if (!firebase.auth().currentUser) {
        //     // Initialize the FirebaseUI Widget using Firebase.
        //     var ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(firebase.auth());;

        //     // The start method will wait until the DOM is loaded.
        //     ui.start('#firebaseui-auth-container', uiConfig);
        // }

        if (this.reloginNeeded()) {
            // go to a url with only the relogin query param deleted
            await firebase.auth().signOut();
            let url = new URL(window.location.href);
            url.searchParams.delete("relogin");
            window.location.href = url.href;
        }

        firebase.auth().onAuthStateChanged(
            async (user) => {
                if (user) {
                    // user is signed in
                    this.setState({ user });
                    let idToken = await user.getIdToken(
                        /* forceRefresh */ true
                    );
                    console.log(idToken);
                    let redirect = this.getRedirectUrl();
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

                    var displayName = user.displayName;
                    var email = user.email;
                    var emailVerified = user.emailVerified;
                    var photoURL = user.photoURL;
                    var uid = user.uid;
                    var phoneNumber = user.phoneNumber;
                    var providerData = user.providerData;
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
                } else {
                    // User is signed out.
                    // Initialize the FirebaseUI Widget using Firebase.
                    var ui =
                        firebaseui.auth.AuthUI.getInstance() ||
                        new firebaseui.auth.AuthUI(firebase.auth());

                    // The start method will wait until the DOM is loaded.
                    ui.start("#firebaseui-auth-container", uiConfig);
                }
            },
            function (error) {
                console.log(error);
            }
        );
    }

    async logout() {
        await firebase.auth().signOut();
        let url = new URL(document.location.href);
        url.searchParams.delete("success");
        url.searchParams.delete("relogin");
        window.location.href = url.href;
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

                {/* <div id="g_id_onload" data-client_id="398384724830-d2vp9p2o4lfk88g3nac35eie19fge14s.apps.googleusercontent.com"
                    data-callback="callback" data-auto_prompt="true" data-ux_mode="redirect">
                </div>
                <div className="g_id_signin" data-type="standard" data-size="large" data-theme="outline" data-text="sign_in_with"
                    data-shape="rectangular" data-logo_alignment="left">
                </div> */}
                <div id="firebaseui-auth-container"></div>
                {this.state.user && "Success. You can close this window."}
            </React.Fragment>
        );
    }
}

export const AuthPage = connect<_Props, {}, {}, RootAppState>(
    (rootAppState: RootAppState) => ({
        homeAppState: rootAppState.home,
    })
)(_AuthPage);
