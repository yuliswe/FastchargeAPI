import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { WithRouteContextProps } from "./App";
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

type SearchResultPageParams = {};
type SearchResultPageQuery = { q?: string; tag?: string; sort?: string; page?: string };
type AppDetailPageParams = { app: string };
type AuthPageQuery = { redirect?: string };

export function buildSearchParams(query: any): string {
    const search = new URLSearchParams();
    for (let key of Object.keys(query)) {
        search.set(key, query[key]);
    }
    return search.toString();
}

/**
 * Note that some routes contain ?auth=true in the URL. This is so that before
 * nagivating to the route, we can check if the user is logged in, and redirect
 * to the auth page if log in is required.
 */
export const RouteURL = {
    searchResultPage({
        params = {},
        query = {},
    }: { params?: SearchResultPageParams; query?: SearchResultPageQuery } = {}) {
        return `/search?${buildSearchParams(query)}` + "#";
    },
    appDetailPage({ params }: { params: AppDetailPageParams }): string {
        return `/app/${params.app}` + "#";
    },
    termsPage(): string {
        return "/terms-of-service#";
    },
    homePage(): string {
        return "/";
    },
    documentationPage(): string {
        if (process.env.REACT_APP_LOCAL_DOC === "1") {
            return "http://localhost:3000";
        }
        return "https://doc.fastchargeapi.com";
    },
    accountPage(): string {
        return `/account?${buildSearchParams({
            auth: true,
        })}#`;
    },
    authPage({ query }: { query?: AuthPageQuery } = {}): string {
        return `/auth?${buildSearchParams(query)}` + "#";
    },
};

export function createRouter(WithContext: (props: WithRouteContextProps) => React.ReactElement) {
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
            path: "/app/:app",
            element: <WithContext children={<AppDetailPage />} />,
        },
        {
            path: "/account",
            element: <WithContext requireAuth={true} children={<AccountPage />} />,
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
