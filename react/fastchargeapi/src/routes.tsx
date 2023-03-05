import { HomePage } from "./connected-components/HomePage";
import { createBrowserRouter } from "react-router-dom";
import { AuthPage } from "./connected-components/AuthPage";
import { OnboardPage } from "./connected-components/OnboardPage";
import { TopUpPage } from "./connected-components/TopupPage";
import React from "react";
import { SearchResultPage } from "./connected-components/SearchResultPage";
import { AppDetailPage } from "./connected-components/AppDetailPage";
import { AccountPage } from "./connected-components/AccountPage";
import { DashboardPage } from "./connected-components/DashboardPage";
import { MyAppsPage } from "./connected-components/MyAppsPage";
import { SubscriptionsPage } from "./connected-components/SubscriptionsPage";
import { MyAppDetailPage } from "./connected-components/MyAppDetailPage";
import { SubscriptionDetailPage } from "./connected-components/SubscriptionDetailPage";
import { TermsPage } from "./connected-components/TermsPage";

export function createRouter(
    WithContext: (props: React.PropsWithChildren) => React.ReactElement
) {
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
            element: <WithContext children={<SearchResultPage />} />,
        },
        {
            path: "/apis/:app",
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
                    element: (
                        <WithContext children={<SubscriptionDetailPage />} />
                    ),
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
