import { useMediaQuery, CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { RouterProvider, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AppContextProvider, defaulAppContext } from "./AppContext";
import React, { useEffect, useState } from "react";
import { initializeFirebase } from "./firebase";
import { getTheme } from "./theme";
import { createRouter } from "./routes";
import { User as FirebaseUser, getAuth, signInAnonymously } from "firebase/auth";

let firebaseApp = initializeFirebase();

function WithContext(props: React.PropsWithChildren) {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [isAnonymousUser, setIsAnonymousUser] = useState<boolean>(true);
    let userPromise = new Promise<FirebaseUser>((resolve) => {
        let auth = getAuth(firebaseApp);
        if (auth.currentUser) {
            resolve(auth.currentUser);
        } else {
            void signInAnonymously(auth);
        }
        useEffect(() => {
            auth.onAuthStateChanged((user) => {
                if (user != null) {
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
