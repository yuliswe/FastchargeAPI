import { Helmet } from "react-helmet-async";
import { useMediaQuery, CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
    RouterProvider,
    useLocation,
    useNavigate,
    useParams,
    useSearchParams,
} from "react-router-dom";
import { AppContextProvider, defaulAppContext } from "./AppContext";
import React, { useEffect, useState } from "react";
import { initializeFirebase } from "./firebase";
import firebase from "firebase/compat/app";
import { getTheme } from "./theme";
import { createRouter } from "./routes";

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

const router = createRouter(WithContext);

function App() {
    return <RouterProvider router={router} />;
}

export default App;
