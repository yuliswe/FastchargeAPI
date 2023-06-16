import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { WithRouteContextProps } from "./App";
import { AppContext } from "./AppContext";
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
import { baseDomain } from "./runtime";

export type SearchResultPageParams = {};
export type SearchResultPageQuery = { q?: string; tag?: string; sort?: string; page?: string };
export type AppDetailPageParams = { app: string };
export type AuthPageQuery = { redirect?: string };
export type TermsPageTag = "pricing" | "privacy" | "tos";
export type DashboardPageQuery = { sdate?: string; spage?: string };
export type SubscriptionDetailPageParams = { app: string };
export type SubscriptionDetailPageQuery = { sdate?: string; spage?: string };
export type MyAppDetailPageParams = { app: string };

export function buildSearchParams(query: any): string {
    const search = new URLSearchParams();
    for (const key of Object.keys(query)) {
        search.set(key, query[key]);
    }
    return search.toString();
}

export const RouteURL = {
    searchResultPage({
        params = {},
        query = {},
    }: { params?: SearchResultPageParams; query?: SearchResultPageQuery } = {}) {
        return `/search/?${buildSearchParams(query)}#`;
    },
    appDetailPage({ params }: { params: AppDetailPageParams }): string {
        return `/app/${params.app}/#`;
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
        return `https://doc.${baseDomain}`;
    },
    accountPage(): string {
        return `/account/#`;
    },
    myAppsPage(): string {
        return `/account/my-apps/#`;
    },
    myAppDetailPage({ params }: { params: MyAppDetailPageParams }): string {
        return `/account/my-apps/${params.app}/#`;
    },
    authPage({ query }: { query?: AuthPageQuery } = {}): string {
        return `/auth/?${buildSearchParams(query)}#`;
    },
    onboardPage(): string {
        return `/onboard/#`;
    },
    subscriptionsPage(): string {
        return `/account/subscriptions/#`;
    },
    dashboardPage({ query }: { query?: DashboardPageQuery }): string {
        return `/account/#`;
    },
    subscriptionDetailPage({
        params,
        query = {},
    }: {
        params: SubscriptionDetailPageParams;
        query?: SubscriptionDetailPageQuery;
    }): string {
        return `/account/subscriptions/${params.app}/?${buildSearchParams(query)}#`;
    },
};

enum RoutePattern {
    AppDetailPage = "/app/:app",
    SubscriptionsPage = "/account/subscriptions",
    SubscriptionDetailPage = "/account/subscriptions/:app",
    HomePage = "/",
    MyAppsPage = "/account/my-apps",
    MyAppDetailPage = "/account/my-apps/:app",
    DashboardPage = "/account",
    TermsPage = "/terms-of-service",
}

/**
 * Every page component should implement a static RouteDataFetcher method.
 */
export type RouteDataFetcher = (context: AppContext, params: any, query: any) => Promise<void>;
export const routeDataFetchers: {
    path: RoutePattern;
    fetchData: RouteDataFetcher;
}[] = [
    {
        path: RoutePattern.AppDetailPage,
        fetchData: (context, params, query) => AppDetailPage.WrappedComponent.fetchData(context, params, query),
    },
    {
        path: RoutePattern.SubscriptionsPage,
        fetchData: (context, params, query) => SubscriptionsPage.WrappedComponent.fetchData(context, params, query),
    },
    {
        path: RoutePattern.HomePage,
        fetchData: (context, params, query) => HomePage.WrappedComponent.fetchData(context, params, query),
    },
    {
        path: RoutePattern.MyAppsPage,
        fetchData: (context, params, query) => MyAppsPage.WrappedComponent.fetchData(context, params, query),
    },
    {
        path: RoutePattern.DashboardPage,
        fetchData: (context, params, query) => DashboardPage.WrappedComponent.fetchData(context, params, query),
    },
    {
        path: RoutePattern.SubscriptionDetailPage,
        fetchData: (context, params, query) =>
            SubscriptionDetailPage.WrappedComponent.fetchData(context, params, query),
    },
    {
        path: RoutePattern.MyAppDetailPage,
        fetchData: (context, params, query) => MyAppDetailPage.WrappedComponent.fetchData(context, params, query),
    },
    {
        path: RoutePattern.TermsPage,
        fetchData: (context, params, query) => TermsPage.WrappedComponent.fetchData(context, params, query),
    },
];

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
            path: RoutePattern.HomePage,
            element: <WithContext children={<HomePage />} />,
        },
        {
            path: "/search",
            element: <WithContext children={<SearchResultPage />} />,
        },
        {
            path: RoutePattern.AppDetailPage,
            element: <WithContext children={<AppDetailPage />} />,
        },
        {
            path: "/account",
            element: <WithContext requireAuth={true} children={<AccountPage />} />,
            children: [
                {
                    path: "",
                    element: <DashboardPage />,
                },
                {
                    path: RoutePattern.MyAppsPage,
                    element: <MyAppsPage />,
                },
                {
                    path: RoutePattern.MyAppDetailPage,
                    element: <MyAppDetailPage />,
                },
                {
                    path: RoutePattern.SubscriptionsPage,
                    element: <SubscriptionsPage />,
                },
                {
                    path: RoutePattern.SubscriptionDetailPage,
                    element: <SubscriptionDetailPage />,
                },
            ],
        },
        {
            path: RoutePattern.TermsPage,
            element: <WithContext children={<TermsPage />} />,
        },
    ]);
    return router;
}
