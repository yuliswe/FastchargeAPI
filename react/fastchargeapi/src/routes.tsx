import React, { useContext, useEffect, useState } from "react";
import { createBrowserRouter, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Error404Page } from "src/connected-components/Error404Page";
import { AppContext, AppContextProvider, ReactAppContextType } from "src/AppContext";
import { AccountPage } from "src/connected-components/AccountPage";
import { AppDetailPage } from "src/connected-components/AppDetailPage";
import { AuthPage } from "src/connected-components/AuthPage";
import { DashboardPage } from "src/connected-components/DashboardPage";
import { HomePage } from "src/connected-components/HomePage";
import { MyAppDetailPage } from "src/connected-components/MyAppDetailPage";
import { MyAppsPage } from "src/connected-components/MyAppsPage";
import { OnboardPage } from "src/connected-components/OnboardPage";
import { SearchResultPage } from "src/connected-components/SearchResultPage";
import { SubscriptionDetailPage } from "src/connected-components/SubscriptionDetailPage";
import { SubscriptionsPage } from "src/connected-components/SubscriptionsPage";
import { TermsPage } from "src/connected-components/TermsPage";
import { TopUpPage } from "src/connected-components/TopUpPage";
import { baseDomain, envVars } from "src/env";

export type SearchResultPageParams = {};
export type SearchResultPageQuery = { q?: string; tag?: string; sort?: string; page?: string };
export type AppDetailPageParams = { app: string };
export type AuthPageQuery = { redirect?: string };
export type TermsPageTag = "pricing" | "privacy" | "tos";
export type DashboardPageQuery = { sdate?: string; spage?: string };
export type SubscriptionDetailPageParams = { app: string };
export type SubscriptionDetailPageQuery = { sdate?: string; spage?: string };
export type MyAppDetailPageParams = { app: string };
export type TopUpPageQuery = { success?: boolean; cancel?: boolean; amount?: string; jtw?: string; jwe?: string };

export function buildSearchParams(
  query?: Record<string, { toString: () => string } | { toString: () => string }[]>
): string {
  if (!query) {
    return "";
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const v of value as { toString: () => string }[]) {
        search.append(key, v.toString());
      }
    } else {
      search.append(key, value.toString());
    }
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
    if (envVars.LOCAL_DOC) {
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
  topUpPage(args: { query?: TopUpPageQuery }): string {
    const { query } = args;
    return `/topup?${buildSearchParams(query)}#`;
  },
  error404Page(): string {
    return "/error404#";
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
  Error404Page = "/error404",
}

export type RouteConfig = React.PropsWithChildren<{
  requireAuth?: boolean;
}>;

export const navigateExternal = (url: string) => {
  window.location.assign(url);
};

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

    void context.firebase.userPromise.then((user) => {
      const { isAnonymous } = user;
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
  }, []);

  return (
    <AppContextProvider
      value={{
        ...context,
        route: {
          location: {
            ...location,
            fullpath: location.pathname + location.search + location.hash,
          },
          navigate,
          navigateExternal,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RouteDataFetcher = (context: AppContext, params: any, query: any) => Promise<void>;
type NestedRoutes = { path: string; fetchData?: RouteDataFetcher; element: React.ReactNode; children?: NestedRoutes }[];
export const routes: NestedRoutes = [
  {
    path: RoutePath.AuthPage,
    element: <RoutePage children={<AuthPage />} />,
  },
  {
    path: RoutePath.OnboardPage,
    element: <RoutePage requireAuth={true} children={<OnboardPage />} />,
    fetchData: DashboardPage.WrappedComponent.fetchData.bind(DashboardPage.WrappedComponent),
  },
  {
    path: RoutePath.TopUpPage,
    element: <RoutePage requireAuth={true} children={<TopUpPage />} />,
  },
  {
    path: RoutePath.HomePage,
    element: <RoutePage children={<HomePage />} />,
    fetchData: HomePage.WrappedComponent.fetchData.bind(HomePage.WrappedComponent),
  },
  {
    path: RoutePath.SearchResultPage,
    element: <RoutePage children={<SearchResultPage />} />,
  },
  {
    path: RoutePath.AppDetailPage,
    element: <RoutePage children={<AppDetailPage />} />,
    fetchData: AppDetailPage.WrappedComponent.fetchData.bind(AppDetailPage.WrappedComponent),
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
        fetchData: MyAppsPage.WrappedComponent.fetchData.bind(MyAppsPage.WrappedComponent),
      },
      {
        path: RoutePath.MyAppDetailPage,
        element: <MyAppDetailPage />,
        fetchData: MyAppDetailPage.WrappedComponent.fetchData.bind(MyAppDetailPage.WrappedComponent),
      },
      {
        path: RoutePath.SubscriptionsPage,
        element: <SubscriptionsPage />,
        fetchData: SubscriptionsPage.WrappedComponent.fetchData.bind(SubscriptionsPage.WrappedComponent),
      },
      {
        path: RoutePath.SubscriptionDetailPage,
        element: <SubscriptionDetailPage />,
        fetchData: SubscriptionDetailPage.WrappedComponent.fetchData.bind(SubscriptionDetailPage.WrappedComponent),
      },
    ],
  },
  {
    path: RoutePath.TermsPage,
    element: <RoutePage children={<TermsPage />} />,
    fetchData: TermsPage.WrappedComponent.fetchData.bind(TermsPage.WrappedComponent),
  },
  {
    path: RoutePath.Error404Page,
    element: <RoutePage children={<Error404Page />} />,
    fetchData: Error404Page.WrappedComponent.fetchData.bind(Error404Page.WrappedComponent),
  },
];

function flattenRoutes(routes: NestedRoutes): { path: string; fetchData?: RouteDataFetcher }[] {
  const result: { path: string; fetchData?: RouteDataFetcher }[] = [];
  for (const route of routes) {
    if (route.children) {
      result.push(...flattenRoutes(route.children));
    } else {
      result.push({ ...route });
    }
  }
  return result;
}
export const routeDataFetchers = flattenRoutes(routes);

export const createRouter = () => createBrowserRouter(routes);
export let globalRouter: ReturnType<typeof createRouter> | undefined = undefined;
export function getRouter() {
  if (globalRouter) {
    return globalRouter;
  }
  globalRouter = createRouter();
  return globalRouter;
}
