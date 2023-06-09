import { gql } from "@apollo/client";
import { CssBaseline, useMediaQuery } from "@mui/material";
import { Theme, ThemeProvider } from "@mui/material/styles";
import { User as FirebaseUser, getAuth, signInAnonymously } from "firebase/auth";
import { throttle } from "lodash";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
    LinkProps,
    LinkProps as RouterLinkProps,
    RouterProvider,
    matchPath,
    useLocation,
    useNavigate,
    useParams,
    useSearchParams,
} from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import { AppContext, AppContextProvider, ReactAppContextType } from "./AppContext";
import { initializeFirebase } from "./firebase";
import { getGQLClient } from "./graphql-client";
import { RouteURL, createRouter, routeDataFetchers } from "./routes";
import { getTheme } from "./theme";
export type WithRouteContextProps = React.PropsWithChildren<{
    requireAuth?: boolean;
    theme?: Theme;
}>;

/**
 * This is a wrapper component that provides a unique context to each pages. It
 * is reconstructed for every route change.
 */
function WithRouteContext(props: WithRouteContextProps) {
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
            let { client, currentUser } = await getGQLClient(context);
            await client.mutate({
                mutation: gql`
                    mutation SendPing {
                        ping
                    }
                `,
            });
        }

        const throttledSendPing = throttle(sendPing, 200_000);

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
                        for (let key of Object.keys(newQuery)) {
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

const router = createRouter(WithRouteContext);

/**
 * Provides the context for the entire app. It is only constructed once.
 */
function App() {
    const firebaseApp = initializeFirebase();

    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [isAnonymousUser, setIsAnonymousUser] = useState<boolean>(true);

    const userPromise = new Promise<FirebaseUser>((resolve) => {
        const auth = getAuth(firebaseApp);
        if (auth.currentUser) {
            resolve(auth.currentUser);
        }
        useEffect(() => {
            auth.onAuthStateChanged((user) => {
                if (user == null) {
                    void signInAnonymously(auth);
                } else {
                    resolve(user);
                    setFirebaseUser(user);
                    setIsAnonymousUser(user.isAnonymous);
                }
            });
            return () => {
                // do nothing
            };
        }, []);
    });

    const theme = getTheme();
    const mediaQueryXsDown = useMediaQuery(theme.breakpoints.down("xs"));
    const mediaQuerySmDown = useMediaQuery(theme.breakpoints.down("sm"));
    const mediaQueryMdDown = useMediaQuery(theme.breakpoints.down("md"));
    const mediaQueryLgDown = useMediaQuery(theme.breakpoints.down("lg"));
    const mediaQueryXlDown = useMediaQuery(theme.breakpoints.down("xl"));
    const mediaQueryXsOnly = useMediaQuery(theme.breakpoints.only("xs"));
    const mediaQuerySmOnly = useMediaQuery(theme.breakpoints.only("sm"));
    const mediaQueryMdOnly = useMediaQuery(theme.breakpoints.only("md"));
    const mediaQueryLgOnly = useMediaQuery(theme.breakpoints.only("lg"));
    const mediaQueryXlOnly = useMediaQuery(theme.breakpoints.only("xl"));
    const mediaQueryXsUp = useMediaQuery(theme.breakpoints.up("xs"));
    const mediaQuerySmUp = useMediaQuery(theme.breakpoints.up("sm"));
    const mediaQueryMdUp = useMediaQuery(theme.breakpoints.up("md"));
    const mediaQueryLgUp = useMediaQuery(theme.breakpoints.up("lg"));
    const mediaQueryXlUp = useMediaQuery(theme.breakpoints.up("xl"));

    const mediaQuery = {
        xs: { down: mediaQueryXsDown, only: mediaQueryXsOnly, up: mediaQueryXsUp },
        sm: { down: mediaQuerySmDown, only: mediaQuerySmOnly, up: mediaQuerySmUp },
        md: { down: mediaQueryMdDown, only: mediaQueryMdOnly, up: mediaQueryMdUp },
        lg: { down: mediaQueryLgDown, only: mediaQueryLgOnly, up: mediaQueryLgUp },
        xl: { down: mediaQueryXlDown, only: mediaQueryXlOnly, up: mediaQueryXlUp },
    };

    const LinkBehavior = React.forwardRef<
        HTMLAnchorElement,
        Omit<RouterLinkProps, "to"> & {
            href: RouterLinkProps["to"];
            isHash: boolean;
        }
    >(({ href, ...other }, ref) => {
        const originalLinkRef = useRef<HTMLAnchorElement>(null);
        // This is the hidden link that used to obtain the original behavior of HashLink.
        const originalLink = <HashLink ref={originalLinkRef} to={href} {...other} style={{ display: "none" }} />;
        // This is the link that's actually displayed and being clicked on. This
        // is modified so that we can add our own behavior.
        const context = useContext(ReactAppContextType);
        const displayLink = (
            <HashLink
                ref={ref}
                to={href}
                {...other}
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                onClick={async (event) => {
                    // If the user has their own onClick handler, call it.
                    if (other.onClick) {
                        other.onClick(event);
                        return;
                    }
                    // In this Link we inject our own logic so that before a
                    // route change, the next page's data is fetched before the
                    // route is changed.
                    event.preventDefault();
                    const url = new URL(href.toString(), window.location.origin);
                    let found = false;
                    // Look in the routeDataFetchers to find the matching data
                    // fetching function.
                    for (const { path, fetchData } of routeDataFetchers) {
                        const match = matchPath(path, url.pathname);
                        if (match) {
                            const queryParams = url.searchParams;
                            context.loading.setIsLoading(true); // Show loading progress bar.
                            await fetchData(context, match.params, queryParams.entries());
                            context.loading.setIsLoading(false); // Hide loading progress bar.
                            originalLinkRef.current?.click(); // Click the orignal link.
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        // If no data fetching function is found, just click the
                        // original link.
                        originalLinkRef.current?.click();
                    }
                }}
            />
        );
        return (
            <React.Fragment>
                {originalLink}
                {displayLink}
            </React.Fragment>
        );
    });

    const context = {
        mediaQuery,
        firebase: {
            user: firebaseUser,
            userPromise,
            isAnonymousUser,
            isAnonymousUserPromise: userPromise.then((user) => user.isAnonymous),
        },
        theme,
    } as AppContext;

    return (
        <AppContextProvider value={context}>
            <ThemeProvider
                theme={getTheme({
                    spacing: context.mediaQuery.xs.down
                        ? 4
                        : context.mediaQuery.sm.down
                        ? 4.5
                        : context.mediaQuery.md.down
                        ? 5
                        : context.mediaQuery.lg.down
                        ? 6
                        : context.mediaQuery.xl.down
                        ? 6.5
                        : 8,
                    typography: {
                        fontSize: context.mediaQuery.xs.down ? 12 : context.mediaQuery.lg.down ? 13 : 14,
                    },
                    components: {
                        MuiButtonBase: {
                            defaultProps: {
                                LinkComponent: LinkBehavior,
                            },
                        },
                        MuiLink: {
                            defaultProps: {
                                component: LinkBehavior,
                            } as unknown as LinkProps, // https://github.com/mui/material-ui/issues/29942
                        },
                    },
                })}
            >
                <CssBaseline />
                <RouterProvider router={router} />
            </ThemeProvider>
        </AppContextProvider>
    );
}

export default App;
