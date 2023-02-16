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
import "./App.css";
import App from "./App";

initializeFirebase();

const root = createRoot(document.getElementById("root")!);
root.render(
    <React.StrictMode>
        <Provider store={reduxStore}>
            <App />
        </Provider>
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
