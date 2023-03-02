import { Helmet, HelmetProvider } from "react-helmet-async";
import { HomePage } from "./connected-components/HomePage";
import { useMediaQuery, CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
    RouterProvider,
    createBrowserRouter,
    useLocation,
    useNavigate,
    useParams,
    useSearchParams,
} from "react-router-dom";
import { AppContextProvider, defaulAppContext } from "./AppContext";
import { AuthPage } from "./connected-components/AuthPage";
import { OnboardPage } from "./connected-components/OnboardPage";
import { TopUpPage } from "./connected-components/TopupPage";
import React, { useEffect, useState } from "react";
import { LinkProps as RouterLinkProps } from "react-router-dom";
import { LinkProps } from "@mui/material/Link";
import { SearchResultPage } from "./connected-components/SearchResultPage";
import { HashLink } from "react-router-hash-link";
import { AppDetailPage } from "./connected-components/AppDetailPage";
import { AccountPage } from "./connected-components/AccountPage";
import { DashboardPage } from "./connected-components/DashboardPage";
import { MyAppsPage } from "./connected-components/MyAppsPage";
import { SubscriptionsPage } from "./connected-components/SubscriptionsPage";
import { MyAppDetailPage } from "./connected-components/MyAppDetailPage";
import { SubscriptionDetailPage } from "./connected-components/SubscriptionDetailPage";
import { initializeFirebase } from "./firebase";
import firebase from "firebase/compat/app";

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
        path: "/apis/:appId",
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
]);

let firebaseInitialzation = initializeFirebase();

function WithContext(props: React.PropsWithChildren) {
    const [firebaseUser, setFirebaseUser] = useState<null | firebase.User>(
        null
    );

    useEffect(() => {
        firebaseInitialzation.user
            .then((user) => {
                setFirebaseUser(user);
            })
            .catch((e) => {
                // do nothing
            });
        return () => {
            // do nothing
        };
    }, [firebaseUser]);

    const defaultTheme = createTheme();
    const mediaQueryXs = useMediaQuery(defaultTheme.breakpoints.down("sm"));
    const mediaQuerySm = useMediaQuery(defaultTheme.breakpoints.down("md"));
    const mediaQueryMd = useMediaQuery(defaultTheme.breakpoints.down("lg"));

    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();
    const query = useSearchParams();

    function getTheme() {
        const blue = "#3772FF";
        const white = "#E8E9EB";
        const yellow = "#FFC100";
        const black = "#313638";
        const red = "#DF2935";
        const LinkBehavior = React.forwardRef<
            HTMLAnchorElement,
            Omit<RouterLinkProps, "to"> & {
                href: RouterLinkProps["to"];
                isHash: boolean;
            }
        >((props, ref) => {
            const { href, ...other } = props;
            // Map href (MUI) -> to (react-router)
            // if (isHash) {
            return <HashLink ref={ref} to={href} {...other} />;
            // } else {
            //     return <RouterLink ref={ref} to={href} {...other} />;
            // }
        });
        return createTheme({
            // spacing: [0, 4, 8, 16, 32, 64],
            // spacing: (factor: number) => `${0.25 * factor}rem`,
            // spacing: mediaQuerySm ? 2 : mediaQueryMd ? 4 : 8,
            palette: {
                background: {
                    default: "#fff",
                    paper: white,
                },
                primary: {
                    main: yellow,
                },
                secondary: {
                    main: black,
                },
                info: {
                    main: blue,
                },
            },
            shape: {
                borderRadius: 2,
            },
            components: {
                MuiPaper: {
                    defaultProps: {
                        elevation: 0,
                    },
                },
                MuiAppBar: {
                    defaultProps: {
                        elevation: 1,
                    },
                },
                MuiMenu: {
                    defaultProps: {
                        elevation: 1,
                    },
                },
                MuiButton: {
                    styleOverrides: {
                        root: {
                            borderRadius: 20,
                            textTransform: "none",
                        },
                    },
                    defaultProps: {
                        LinkComponent: LinkBehavior,
                        // disableElevation: true,
                    },
                },
                MuiOutlinedInput: {
                    styleOverrides: {
                        root: {
                            borderRadius: 5,
                        },
                    },
                },
                MuiTypography: {
                    styleOverrides: {
                        h1: {
                            fontFamily: "Finger Paint",
                            fontSize: 50,
                        },
                        h2: {
                            fontFamily: "Roboto",
                            fontWeight: 400,
                            fontSize: 40,
                        },
                        h3: {
                            fontFamily: "Finger Paint",
                            fontSize: 30,
                        },
                        body1: {
                            fontFamily: "Roboto",
                        },
                    },
                },
                MuiLink: {
                    styleOverrides: {
                        root: {
                            textDecoration: "none",
                            // "&:hover": {
                            //     textDecoration: "underline",
                            // },
                        },
                    },
                    defaultProps: {
                        color: "primary.contrastText",
                        component: LinkBehavior,
                    } as LinkProps,
                },
            },
        });
    }

    const theme = getTheme();

    return (
        <React.Fragment>
            <Helmet>
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
                />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/icon?family=Material+Icons"
                />
                <script
                    src="https://accounts.google.com/gsi/client"
                    async
                    defer
                ></script>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin=""
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Coda&family=Finger+Paint&family=Ubuntu&display=swap"
                    rel="stylesheet"
                />
            </Helmet>
            <AppContextProvider
                value={{
                    ...defaulAppContext,
                    mediaQuery: {
                        sm: mediaQuerySm,
                        md: mediaQueryMd,
                        xs: mediaQueryXs,
                    },
                    firebase: {
                        user: firebaseUser,
                        userPromise: firebaseInitialzation.user,
                    },
                    isLoggedIn: firebaseUser != null,
                    route: {
                        location,
                        locationHref:
                            location.pathname + location.search + location.hash,
                        navigate,
                        params,
                        query: query[0],
                        setQuery: query[1],
                        updateQuery: (newQuery) => {
                            let current = query[0];
                            let search = new URLSearchParams(
                                current?.toString()
                            );
                            for (let key of Object.keys(newQuery)) {
                                if (newQuery[key] == null) {
                                    search.delete(key);
                                } else {
                                    search.set(key, newQuery[key]!);
                                }
                            }
                            query[1](search.toString());
                        },
                    },
                    theme,
                }}
            >
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <Helmet>
                        <link
                            rel="stylesheet"
                            href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
                        />
                    </Helmet>
                    {props.children}
                </ThemeProvider>
            </AppContextProvider>
        </React.Fragment>
    );
}

function App() {
    return <RouterProvider router={router} />;
}

export default App;
