import { AppStore } from "react-appevent-redux";
import * as Redux from "@reduxjs/toolkit";
import { RootAppState } from "./states/RootAppState";

function rootReducer(state: RootAppState | undefined, action: Redux.AnyAction) {
  return state ?? new RootAppState({});
}

export const reduxStore = Redux.configureStore({
  preloadedState: new RootAppState({}),
  reducer: AppStore.wrapReducer(rootReducer),
  middleware: (getDefaultMiddleware) =>
    // react-appevent-redux uses classes to represent states
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const appStore = new AppStore<RootAppState>({
  reduxStore: reduxStore,
});
