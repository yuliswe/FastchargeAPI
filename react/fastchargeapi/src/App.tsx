import { gql } from "@apollo/client";
import { CssBaseline, useMediaQuery } from "@mui/material";
import { Theme, ThemeProvider } from "@mui/material/styles";
import { User as FirebaseUser, getAuth, signInAnonymously } from "firebase/auth";
import React, { useContext, useEffect, useState } from "react";
import {
    LinkProps,
    LinkProps as RouterLinkProps,
    RouterProvider,
    useLocation,
    useNavigate,
    useParams,
    useSearchParams,
} from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import { AppContext, AppContextProvider, ReactAppContextType, defaulAppContext } from "./AppContext";
import { initializeFirebase } from "./firebase";
import { getGQLClient } from "./graphql-client";
import { RouteURL, createRouter } from "./routes";
import { getTheme } from "./theme";

let firebaseApp = initializeFirebase();

export type WithRouteContextProps = React.PropsWithChildren<{
    requireAuth?: boolean;
    theme?: Theme;
}>;
function WithRouteContext(props: WithRouteContextProps) {
    // Note: things here are reloaded on every route change.
    const context = useContext(ReactAppContextType);
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();
    const [searchParam, setSearchParam] = useSearchParams();

    const requireAuth = props.requireAuth ?? false;
    // Hide content so that it doesn't flash before the user is redirected.
    const [hideContent, setHideContent] = useState(requireAuth);
    // This promise is resolved immediately except in the initial load of the app.
    useEffect(() => {
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
        void getGQLClient(context).then(({ client, currentUser }) => {
            return client.query({
                query: gql`
                    query Ping {
                        ping
                    }
                `,
            });
        });
        let shouldPing = false;
        setTimeout(() => {
            shouldPing = true;
        }, 200_000);
        function pingWhenActive() {
            if (shouldPing) {
                shouldPing = false;
                void getGQLClient(context).then(async ({ client, currentUser }) => {
                    await client.query({
                        query: gql`
                            query Ping {
                                ping
                            }
                        `,
                    });
                    setTimeout(() => {
                        shouldPing = true;
                    }, 200_000);
                });
            }
        }
        window.addEventListener("mousemove", pingWhenActive);
        window.addEventListener("scroll", pingWhenActive);
        return () => {
            window.removeEventListener("mousemove", pingWhenActive);
            window.removeEventListener("scroll", pingWhenActive);
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
            }}
        >
            {hideContent || props.children}
        </AppContextProvider>
    );
}

const router = createRouter(WithRouteContext);

function App() {
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
    const mediaQueryXsOnly = useMediaQuery(theme.breakpoints.only("xs"));
    const mediaQuerySmOnly = useMediaQuery(theme.breakpoints.only("sm"));
    const mediaQueryMdOnly = useMediaQuery(theme.breakpoints.only("md"));
    const mediaQueryLgOnly = useMediaQuery(theme.breakpoints.only("lg"));
    const mediaQueryXsUp = useMediaQuery(theme.breakpoints.up("xs"));
    const mediaQuerySmUp = useMediaQuery(theme.breakpoints.up("sm"));
    const mediaQueryMdUp = useMediaQuery(theme.breakpoints.up("md"));
    const mediaQueryLgUp = useMediaQuery(theme.breakpoints.up("lg"));

    const mediaQuery = {
        xs: { down: mediaQueryXsDown, only: mediaQueryXsOnly, up: mediaQueryXsUp },
        sm: { down: mediaQuerySmDown, only: mediaQuerySmOnly, up: mediaQuerySmUp },
        md: { down: mediaQueryMdDown, only: mediaQueryMdOnly, up: mediaQueryMdUp },
        lg: { down: mediaQueryLgDown, only: mediaQueryLgOnly, up: mediaQueryLgUp },
    };

    const LinkBehavior = React.forwardRef<
        HTMLAnchorElement,
        Omit<RouterLinkProps, "to"> & {
            href: RouterLinkProps["to"];
            isHash: boolean;
        }
    >(({ href, ...other }, ref) => {
        return <HashLink ref={ref} to={href} {...other} />;
    });

    const context: AppContext = {
        ...defaulAppContext,
        mediaQuery,
        firebase: {
            user: firebaseUser,
            userPromise,
            isAnonymousUser,
            isAnonymousUserPromise: userPromise.then((user) => user.isAnonymous),
        },
        theme,
    };

    return (
        <AppContextProvider value={context}>
            <ThemeProvider
                theme={getTheme({
                    spacing: mediaQuery.xs.only ? 4 : 8,
                    typography: {
                        fontSize: mediaQuery.xs.only ? 12 : 14,
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
