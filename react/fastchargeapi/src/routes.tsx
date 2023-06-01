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
type TermsPageTag = "pricing" | "privacy" | "tos";

export function buildSearchParams(query: any): string {
    const search = new URLSearchParams();
    for (let key of Object.keys(query)) {
        search.set(key, query[key]);
    }
    return search.toString();
}

export const RouteURL = {
    searchResultPage({
        params = {},
        query = {},
    }: { params?: SearchResultPageParams; query?: SearchResultPageQuery } = {}) {
        return `/search/?${buildSearchParams(query)}` + "#";
    },
    appDetailPage({ params }: { params: AppDetailPageParams }): string {
        return `/app/${params.app}/` + "#";
    },
    termsPage({ tag }: { tag?: TermsPageTag } = {}): string {
        return `/terms-of-service/#${tag ?? ""}`;
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
        return `/account/#`;
    },
    myAppsPage(): string {
        return `/account/my-apps/#`;
    },
    authPage({ query }: { query?: AuthPageQuery } = {}): string {
        return `/auth/?${buildSearchParams(query)}` + "#";
    },
    onboardPage(): string {
        return `/onboard/#`;
    },
    subscriptionsPage(): string {
        return `/account/subscriptions/#`;
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
            element: <WithContext requireAuth={true} children={<OnboardPage />} />,
        },
        {
            path: "/topup",
            element: <WithContext requireAuth={true} children={<TopUpPage />} />,
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
                    element: <WithContext requireAuth={true} children={<DashboardPage />} />,
                },
                {
                    path: "my-apps",
                    element: <WithContext requireAuth={true} children={<MyAppsPage />} />,
                },
                {
                    path: "my-apps/:app",
                    element: <WithContext requireAuth={true} children={<MyAppDetailPage />} />,
                },
                {
                    path: "subscriptions",
                    element: <WithContext requireAuth={true} children={<SubscriptionsPage />} />,
                },
                {
                    path: "subscriptions/:app",
                    element: <WithContext requireAuth={true} children={<SubscriptionDetailPage />} />,
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
