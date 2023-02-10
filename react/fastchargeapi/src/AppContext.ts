import React from "react";

export const defaulAppContext = {
    DEV: false,
    paymentGatewayHost: "https://api.payment.fastchargeapi.com",
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
