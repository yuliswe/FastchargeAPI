import React from "react";
import {
    Params,
    Location,
    NavigateFunction,
    useSearchParams,
} from "react-router-dom";
import firebase from "firebase/compat/app";

export const defaulAppContext = {
    DEV: false,
    paymentGatewayHost: "https://api.payment.fastchargeapi.com",
    mediaQuery: {
        xs: false,
        sm: false,
        md: false,
    },
    firebase: null as unknown as {
        user: null | firebase.User;
        userPromise: Promise<firebase.User | null>;
    },
    route: null as {
        location: Location;
        navigate: NavigateFunction;
        params: Params<string>;
        query: ReturnType<typeof useSearchParams>[0];
        setQuery: ReturnType<typeof useSearchParams>[1];
        updateQuery: (query: Record<string, string | null | undefined>) => void;
    } | null,
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
