import { Theme } from "@mui/material/styles";
import { User as FirebaseUser } from "firebase/auth";
import React from "react";
import { Location, NavigateFunction, Params, useSearchParams } from "react-router-dom";
export type AppContext = {
  mediaQuery: {
    xs: { down: boolean; only: boolean; up: boolean };
    sm: { down: boolean; only: boolean; up: boolean };
    md: { down: boolean; only: boolean; up: boolean };
    lg: { down: boolean; only: boolean; up: boolean };
    xl: { down: boolean; only: boolean; up: boolean };
  };
  firebase: {
    user: FirebaseUser | null;
    userPromise: Promise<FirebaseUser>;
    isAnonymousUser: boolean;
    isAnonymousUserPromise: Promise<boolean>;
  };
  route: {
    location: Location; // Equivalent to window.location
    locationHref: string; // Equivalent to location.pathname + location.search + location.hash
    navigate: NavigateFunction;
    params: Params<string>; // Gets the values of the current route's dynamic segments, for example the id of /users/:id
    query: ReturnType<typeof useSearchParams>[0]; // Gets the values of the current route's query string, ie, the part after the ? in /users?search=abc
    setQuery: ReturnType<typeof useSearchParams>[1]; // Sets the query params with an encoded string, eg setQuery("search=abc")
    updateQuery: (query: Record<string, string | null | undefined>) => void; // Sets the query params with a dictionary, eg updateQuery({search: "abc"})
  };
  theme: Theme;
  loading: {
    isLoading: boolean;
    setIsLoading: (value: boolean) => void;
  };
};

export const ReactAppContextType = React.createContext<AppContext>(null!); // We will assign all properties in App.tsx
export const AppContextProvider = ReactAppContextType.Provider;
