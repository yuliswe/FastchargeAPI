import reportWebVitals from "./reportWebVitals";
import { Provider } from "react-redux";
import { reduxStore } from "./store-config";
import { createRoot } from "react-dom/client";

import { HelmetProvider } from "react-helmet-async";
import React from "react";
import "./App.scss";
import App from "./App";

const root = createRoot(document.getElementById("root")!);
root.render(
    <React.StrictMode>
        <Provider store={reduxStore}>
            <HelmetProvider>
                <App />
            </HelmetProvider>
        </Provider>
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
