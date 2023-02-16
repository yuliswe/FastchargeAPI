import React from "react";
import {
    Params,
    Location,
    NavigateFunction,
    useSearchParams,
} from "react-router-dom";

export const defaulAppContext = {
    DEV: false,
    paymentGatewayHost: "https://api.payment.fastchargeapi.com",
    mediaQuery: {
        xs: false,
        sm: false,
        md: false,
    },
    route: null as {
        location: Location;
        navigate: NavigateFunction;
        params: Params<string>;
        query: ReturnType<typeof useSearchParams>[0];
        setQuery: ReturnType<typeof useSearchParams>[1];
        updateQuery: (query: Record<string, string | null>) => void;
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
