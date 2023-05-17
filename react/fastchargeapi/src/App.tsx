import { CssBaseline, useMediaQuery } from "@mui/material";
import { Theme, ThemeProvider } from "@mui/material/styles";
import { User as FirebaseUser, getAuth, signInAnonymously } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { RouterProvider, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AppContextProvider, defaulAppContext } from "./AppContext";
import { initializeFirebase } from "./firebase";
import { createRouter } from "./routes";
import { defaultTheme } from "./theme";
let firebaseApp = initializeFirebase();

export type WithContextProps = React.PropsWithChildren<{
    theme?: Theme;
}>;

function WithContext(props: WithContextProps) {
    const theme = props.theme ?? defaultTheme;
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [isAnonymousUser, setIsAnonymousUser] = useState<boolean>(true);
    let userPromise = new Promise<FirebaseUser>((resolve) => {
        let auth = getAuth(firebaseApp);
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
        });
    });

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

    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();
    const query = useSearchParams();

    return (
        <React.Fragment>
            <AppContextProvider
                value={{
                    ...defaulAppContext,
                    mediaQuery,
                    firebase: {
                        user: firebaseUser,
                        userPromise,
                        isAnonymousUser,
                        isAnonymousUserPromise: userPromise.then((user) => user.isAnonymous),
                    },
                    route: {
                        location,
                        locationHref: location.pathname + location.search + location.hash,
                        navigate,
                        params,
                        query: query[0],
                        setQuery: query[1],
                        updateQuery: (newQuery) => {
                            let current = query[0];
                            let search = new URLSearchParams(current?.toString());
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
