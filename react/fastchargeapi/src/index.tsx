import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { Provider } from "react-redux";
import { reduxStore } from "./store-config";
import { createRoot } from "react-dom/client";

import { Helmet, HelmetProvider } from "react-helmet-async";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import React from "react";
import { HomePage } from "./connected-components/HomePage";
import { AuthPage } from "./connected-components/AuthPage";
import { OnboardPage } from "./connected-components/OnboardPage";
import { TopUpPage } from "./connected-components/TopupPage";
import { AppContextProvider, defaulAppContext } from "./AppContext";
import { initializeFirebase } from "./firebase";

initializeFirebase();

const router = createBrowserRouter([
    {
        path: "/",
        element: <HomePage />,
    },
    {
        path: "/auth",
        element: <AuthPage />,
    },
    {
        path: "/onboard",
        element: <OnboardPage />,
    },
    {
        path: "/topup",
        element: <TopUpPage />,
    },
]);
const root = createRoot(document.getElementById("root")!);
root.render(
    <React.StrictMode>
        <AppContextProvider value={defaulAppContext}>
            <Provider store={reduxStore}>
                <HelmetProvider>
                    <Helmet>
                        <link
                            rel="stylesheet"
                            href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
                        />
                        <link
                            rel="stylesheet"
                            href="https://fonts.googleapis.com/icon?family=Material+Icons"
                        />
                    </Helmet>
                    <RouterProvider router={router} />
                </HelmetProvider>
            </Provider>
        </AppContextProvider>
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
