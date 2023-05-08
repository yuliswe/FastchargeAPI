import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { WithContextProps } from "./App";
import { AccountPage } from "./connected-components/AccountPage";
import { AppDetailPage } from "./connected-components/AppDetailPage";
import { AuthPage } from "./connected-components/AuthPage";
import { DashboardPage } from "./connected-components/DashboardPage";
import { HomePage } from "./connected-components/HomePage";
import { MyAppDetailPage } from "./connected-components/MyAppDetailPage";
import { MyAppsPage } from "./connected-components/MyAppsPage";
import { OnboardPage } from "./connected-components/OnboardPage";
import { SearchResultPage } from "./connected-components/SearchResultPage";
import { SubscriptionDetailPage } from "./connected-components/SubscriptionDetailPage";
import { SubscriptionsPage } from "./connected-components/SubscriptionsPage";
import { TermsPage } from "./connected-components/TermsPage";
import { TopUpPage } from "./connected-components/TopupPage";
import { themeWithWhiteBackground } from "./theme";

export function createRouter(WithContext: (props: WithContextProps) => React.ReactElement) {
    const router = createBrowserRouter([
        {
            path: "/auth",
            element: <WithContext children={<AuthPage />} />,
        },
        {
            path: "/onboard",
            element: <WithContext children={<OnboardPage />} />,
        },
        {
            path: "/topup",
            element: <WithContext children={<TopUpPage />} />,
        },
        {
            path: "/",
            element: <WithContext children={<HomePage />} />,
        },
        {
            path: "/search",
            element: <WithContext children={<SearchResultPage />} theme={themeWithWhiteBackground} />,
        },
        {
            path: "/app/:app",
            element: <WithContext children={<AppDetailPage />} />,
        },
        {
            path: "/account",
            element: <WithContext children={<AccountPage />} />,
            children: [
                {
                    path: "",
                    element: <WithContext children={<DashboardPage />} />,
                },
                {
                    path: "my-apps",
                    element: <WithContext children={<MyAppsPage />} />,
                },
                {
                    path: "my-apps/:app",
                    element: <WithContext children={<MyAppDetailPage />} />,
                },
                {
                    path: "subscriptions",
                    element: <WithContext children={<SubscriptionsPage />} />,
                },
                {
                    path: "subscriptions/:app",
                    element: <WithContext children={<SubscriptionDetailPage />} />,
                },
            ],
        },
        {
            path: "/terms-of-service",
            element: <WithContext children={<TermsPage />} />,
        },
    ]);
    return router;
}
