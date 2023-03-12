import React from "react";
import {
    Params,
    Location,
    NavigateFunction,
    useSearchParams,
} from "react-router-dom";
import { Theme } from "@mui/material/styles";
import { User as FirebaseUser } from "firebase/auth";

export const defaulAppContext = {
    DEV: false,
    paymentGatewayHost: "https://api.payment.fastchargeapi.com",
    mediaQuery: {
        xs: false,
        sm: false,
        md: false,
    },
    firebase: null as unknown as {
        user: null | FirebaseUser;
        userPromise: Promise<FirebaseUser | null>;
    },
    isLoggedIn: false, // Equivalent to FirebaseUser != null
    route: null as unknown as {
        location: Location;
        locationHref: string; // Equivalent to location.pathname + location.search + location.hash
        navigate: NavigateFunction;
        params: Params<string>;
        query: ReturnType<typeof useSearchParams>[0];
        setQuery: ReturnType<typeof useSearchParams>[1];
        updateQuery: (query: Record<string, string | null | undefined>) => void;
    },
    theme: null as unknown as Theme,
};

export const ReactAppContextType = React.createContext(defaulAppContext);
export const AppContextProvider = ReactAppContextType.Provider;
export type AppContext = typeof defaulAppContext;

export function createAppContext(context: AppContext): AppContext {
    context = { ...defaulAppContext, ...context };
    if (context.DEV) {
        context.paymentGatewayHost = "http://localhost:3000";
    }
    return context;
}
