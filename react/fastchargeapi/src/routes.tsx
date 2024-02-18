import { gql } from "@apollo/client";
import { throttle } from "lodash";
import React, { useContext, useEffect, useState } from "react";
import { createBrowserRouter, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AppContext, AppContextProvider, ReactAppContextType } from "./AppContext";
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
import { getGQLClient } from "./graphql-client";
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

export function buildSearchParams(query?: Record<string, string>): string {
  if (!query) {
    return "";
  }
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

enum RoutePath {
  AppDetailPage = "/app/:app",
  SubscriptionsPage = "/account/subscriptions",
  SubscriptionDetailPage = "/account/subscriptions/:app",
  HomePage = "/",
  MyAppsPage = "/account/my-apps",
  MyAppDetailPage = "/account/my-apps/:app",
  DashboardPage = "/account",
  TermsPage = "/terms-of-service",
  AuthPage = "/auth",
  OnboardPage = "/onboard",
  TopUpPage = "/topup",
  SearchResultPage = "/search",
  AccountPage = "/account",
}

/**
 * Every page component should implement a static RouteDataFetcher method.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RouteDataFetcher = (context: AppContext, params: any, query: any) => Promise<void>;
export const routeDataFetchers: {
  path: RoutePath;
  fetchData: RouteDataFetcher;
}[] = [
  {
    path: RoutePath.AppDetailPage,
    fetchData: AppDetailPage.WrappedComponent.fetchData.bind(AppDetailPage.WrappedComponent),
  },
  {
    path: RoutePath.SubscriptionsPage,
    fetchData: SubscriptionsPage.WrappedComponent.fetchData.bind(SubscriptionsPage.WrappedComponent),
  },
  {
    path: RoutePath.HomePage,
    fetchData: HomePage.WrappedComponent.fetchData.bind(HomePage.WrappedComponent),
  },
  {
    path: RoutePath.MyAppsPage,
    fetchData: MyAppsPage.WrappedComponent.fetchData.bind(MyAppsPage.WrappedComponent),
  },
  {
    path: RoutePath.DashboardPage,
    fetchData: DashboardPage.WrappedComponent.fetchData.bind(DashboardPage.WrappedComponent),
  },
  {
    path: RoutePath.SubscriptionDetailPage,
    fetchData: SubscriptionDetailPage.WrappedComponent.fetchData.bind(SubscriptionDetailPage.WrappedComponent),
  },
  {
    path: RoutePath.MyAppDetailPage,
    fetchData: MyAppDetailPage.WrappedComponent.fetchData.bind(MyAppDetailPage.WrappedComponent),
  },
  {
    path: RoutePath.TermsPage,
    fetchData: TermsPage.WrappedComponent.fetchData.bind(TermsPage.WrappedComponent),
  },
];

export type RouteConfig = React.PropsWithChildren<{
  requireAuth?: boolean;
}>;

/**
 * This is a wrapper component that provides a unique context to each pages. It
 * is reconstructed for every route change.
 */
function RoutePage(props: RouteConfig) {
  // Note: things here are reloaded on every route change.
  const context = useContext(ReactAppContextType);
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParam, setSearchParam] = useSearchParams();
  // A state that is passed in AppContext. It determines when to show the
  // progress bar on top of the page.
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const requireAuth = props.requireAuth ?? false;
  // Hide content so that it doesn't flash before the user is redirected.
  const [hideContent, setHideContent] = useState(requireAuth);
  // This promise is resolved immediately except in the initial load of the app.
  useEffect(() => {
    setTimeout(() => {
      // Most pages should load in less than 1 second. On initial page
      // load, the progress bar shows for 1s.
      setIsLoading(false);
    }, 1000);

    void context.firebase.isAnonymousUserPromise.then((isAnonymous) => {
      if (hideContent) {
        setHideContent(false);
      }
      if (isAnonymous && requireAuth) {
        navigate(
          RouteURL.authPage({
            query: {
              redirect: location.pathname + location.search + location.hash,
            },
          }),
          { replace: true }
        );
      }
    });

    async function sendPing() {
      const { client } = await getGQLClient(context);
      await client.mutate({
        mutation: gql`
          mutation SendPing {
            ping
          }
        `,
      });
    }

    const throttledSendPing = throttle(sendPing, 200000);

    void throttledSendPing();
    window.addEventListener("mousemove", () => void throttledSendPing());
    window.addEventListener("scroll", () => void throttledSendPing());
    return () => {
      window.removeEventListener("mousemove", () => void throttledSendPing());
      window.removeEventListener("scroll", () => void throttledSendPing());
    };
  }, []);

  return (
    <AppContextProvider
      value={{
        ...context,
        route: {
          location,
          locationHref: location.pathname + location.search + location.hash,
          navigate,
          params,
          query: searchParam,
          setQuery: setSearchParam,
          updateQuery: (newQuery: { [key: string]: string | null | undefined }) => {
            const search = new URLSearchParams(searchParam);
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            for (const key of Object.keys(newQuery) as string[]) {
              if (newQuery[key] == null) {
                search.delete(key);
              } else {
                search.set(key, newQuery[key]!);
              }
            }
            setSearchParam(search.toString());
          },
        },
        loading: {
          isLoading,
          setIsLoading,
        },
      }}
    >
      {hideContent || props.children}
    </AppContextProvider>
  );
}

export function createRouter() {
  const router = createBrowserRouter([
    {
      path: RoutePath.AuthPage,
      element: <RoutePage children={<AuthPage />} />,
    },
    {
      path: RoutePath.OnboardPage,
      element: <RoutePage requireAuth={true} children={<OnboardPage />} />,
    },
    {
      path: RoutePath.TopUpPage,
      element: <RoutePage requireAuth={true} children={<TopUpPage />} />,
    },
    {
      path: RoutePath.HomePage,
      element: <RoutePage children={<HomePage />} />,
    },
    {
      path: RoutePath.SearchResultPage,
      element: <RoutePage children={<SearchResultPage />} />,
    },
    {
      path: RoutePath.AppDetailPage,
      element: <RoutePage children={<AppDetailPage />} />,
    },
    {
      path: RoutePath.AccountPage,
      element: <RoutePage requireAuth={true} children={<AccountPage />} />,
      children: [
        {
          path: "",
          element: <DashboardPage />,
        },
        {
          path: RoutePath.MyAppsPage,
          element: <MyAppsPage />,
        },
        {
          path: RoutePath.MyAppDetailPage,
          element: <MyAppDetailPage />,
        },
        {
          path: RoutePath.SubscriptionsPage,
          element: <SubscriptionsPage />,
        },
        {
          path: RoutePath.SubscriptionDetailPage,
          element: <SubscriptionDetailPage />,
        },
      ],
    },
    {
      path: RoutePath.TermsPage,
      element: <RoutePage children={<TermsPage />} />,
    },
  ]);
  return router;
}
