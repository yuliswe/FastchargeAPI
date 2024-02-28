import { gql } from "@apollo/client";
import { CssBaseline, useMediaQuery } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { User as FirebaseUser, getAuth, signInAnonymously } from "firebase/auth";
import { throttle } from "lodash";
import { useEffect, useRef, useState } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Provider } from "react-redux";
import { LinkProps, RouterProvider } from "react-router-dom";
import { getGQLClient } from "src/graphql-client";
import { AppContext, AppContextProvider } from "src/AppContext";
import { LinkBehavior } from "src/LinkBehavior";
import { useRenderingTrace } from "src/debug";
import { initializeFirebase } from "src/firebase";
import { createRouter } from "src/routes";
import { reduxStore } from "src/store-config";
import { getTheme } from "src/theme";

export const sendPing = async (context: AppContext) => {
  const { client } = await getGQLClient(context);
  await client.mutate({
    mutation: gql`
      mutation SendPing {
        ping
      }
    `,
  });
};

const originalTheme = getTheme();

/**
 * Provides the context for the entire app. It is only constructed once.
 */
export function App() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const userPromiseResolve = useRef<null | ((user: FirebaseUser) => void)>();
  const userPromise = useRef(new Promise<FirebaseUser>((resolve) => (userPromiseResolve.current = resolve)));

  useEffect(() => {
    void userPromise.current.then((user) => {
      setFirebaseUser(user);
    });

    const firebaseApp = initializeFirebase();
    const auth = getAuth(firebaseApp);
    if (auth.currentUser) {
      userPromiseResolve.current?.(auth.currentUser);
    }
    auth.onAuthStateChanged((user) => {
      if (user == null) {
        void signInAnonymously(auth);
      } else {
        userPromiseResolve.current?.(user);
      }
    });
  }, []);

  const mediaQueryXsDown = useMediaQuery(originalTheme.breakpoints.down("xs"));
  const mediaQuerySmDown = useMediaQuery(originalTheme.breakpoints.down("sm"));
  const mediaQueryMdDown = useMediaQuery(originalTheme.breakpoints.down("md"));
  const mediaQueryLgDown = useMediaQuery(originalTheme.breakpoints.down("lg"));
  const mediaQueryXlDown = useMediaQuery(originalTheme.breakpoints.down("xl"));
  const mediaQueryXsOnly = useMediaQuery(originalTheme.breakpoints.only("xs"));
  const mediaQuerySmOnly = useMediaQuery(originalTheme.breakpoints.only("sm"));
  const mediaQueryMdOnly = useMediaQuery(originalTheme.breakpoints.only("md"));
  const mediaQueryLgOnly = useMediaQuery(originalTheme.breakpoints.only("lg"));
  const mediaQueryXlOnly = useMediaQuery(originalTheme.breakpoints.only("xl"));
  const mediaQueryXsUp = useMediaQuery(originalTheme.breakpoints.up("xs"));
  const mediaQuerySmUp = useMediaQuery(originalTheme.breakpoints.up("sm"));
  const mediaQueryMdUp = useMediaQuery(originalTheme.breakpoints.up("md"));
  const mediaQueryLgUp = useMediaQuery(originalTheme.breakpoints.up("lg"));
  const mediaQueryXlUp = useMediaQuery(originalTheme.breakpoints.up("xl"));

  const mediaQuery = {
    xs: { down: mediaQueryXsDown, only: mediaQueryXsOnly, up: mediaQueryXsUp },
    sm: { down: mediaQuerySmDown, only: mediaQuerySmOnly, up: mediaQuerySmUp },
    md: { down: mediaQueryMdDown, only: mediaQueryMdOnly, up: mediaQueryMdUp },
    lg: { down: mediaQueryLgDown, only: mediaQueryLgOnly, up: mediaQueryLgUp },
    xl: { down: mediaQueryXlDown, only: mediaQueryXlOnly, up: mediaQueryXlUp },
  };

  const modifiedTheme = getTheme({
    spacing: mediaQuery.xs.down
      ? 4
      : mediaQuery.sm.down
      ? 4.5
      : mediaQuery.md.down
      ? 5
      : mediaQuery.lg.down
      ? 6
      : mediaQuery.xl.down
      ? 6.5
      : 8,
    typography: {
      fontSize: mediaQuery.xs.down ? 12 : mediaQuery.lg.down ? 13 : 14,
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
  });

  const context = {
    mediaQuery,
    firebase: {
      user: firebaseUser,
      userPromise: userPromise.current,
    },
    theme: modifiedTheme,
  } as AppContext;

  useRenderingTrace("App", { context, firebaseUser, originalTheme, reduxStore });

  useEffect(() => {
    const throttledSendPing = throttle(() => sendPing(context), 200000);
    void throttledSendPing();
    const installedHandler = () => void throttledSendPing();
    window.addEventListener("mousemove", installedHandler);
    window.addEventListener("scroll", installedHandler);
    return () => {
      window.removeEventListener("mousemove", installedHandler);
      window.removeEventListener("scroll", installedHandler);
    };
  }, []);

  return (
    <Provider store={reduxStore}>
      <HelmetProvider>
        <AppContextProvider value={context}>
          <ThemeProvider theme={originalTheme}>
            <CssBaseline />
            <RouterProvider router={createRouter()} />
          </ThemeProvider>
        </AppContextProvider>
      </HelmetProvider>
    </Provider>
  );
}
