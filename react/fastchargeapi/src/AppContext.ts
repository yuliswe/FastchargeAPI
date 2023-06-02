import { Theme } from "@mui/material/styles";
import { User as FirebaseUser } from "firebase/auth";
import React from "react";
import { Location, NavigateFunction, Params, useSearchParams } from "react-router-dom";

export const defaulAppContext = {
    mediaQuery: {
        xs: { down: false, only: false, up: false },
        sm: { down: false, only: false, up: false },
        md: { down: false, only: false, up: false },
        lg: { down: false, only: false, up: false },
    },
    firebase: null as unknown as {
        user: FirebaseUser | null;
        userPromise: Promise<FirebaseUser>;
        isAnonymousUser: boolean;
        isAnonymousUserPromise: Promise<boolean>;
    },
    route: null as unknown as {
        location: Location; // Equivalent to window.location
        locationHref: string; // Equivalent to location.pathname + location.search + location.hash
        navigate: NavigateFunction;
        params: Params<string>; // Gets the values of the current route's dynamic segments, for example the id of /users/:id
        query: ReturnType<typeof useSearchParams>[0]; // Gets the values of the current route's query string, ie, the part after the ? in /users?search=abc
        setQuery: ReturnType<typeof useSearchParams>[1]; // Sets the query params with an encoded string, eg setQuery("search=abc")
        updateQuery: (query: Record<string, string | null | undefined>) => void; // Sets the query params with a dictionary, eg updateQuery({search: "abc"})
    },
    theme: null as unknown as Theme,
};

export const ReactAppContextType = React.createContext(defaulAppContext);
export const AppContextProvider = ReactAppContextType.Provider;
export type AppContext = typeof defaulAppContext;
