import React from "react";
import { connect } from "react-redux";
import { ReactAppContextType, type AppContext } from "src/AppContext";
import { SiteLayout } from "src/SiteLayout";
import type { Error404AppState } from "src/states/Error404AppState";
import { RootAppState } from "src/states/RootAppState";
import { reduxStore } from "src/store-config";

type _State = {};

type _Props = {
  appState: Error404AppState;
};

class _Error404Page extends React.PureComponent<_Props, _State> {
  static contextType = ReactAppContextType;
  get _context() {
    return this.context as AppContext;
  }

  constructor(props: _Props) {
    super(props);
    this.state = {};
  }

  static isLoading(): boolean {
    return false;
  }

  static async fetchData(context: AppContext, params: {}, query: {}): Promise<void> {
    return new Promise<void>((resolve) => {
      const unsub = reduxStore.subscribe(() => {
        if (!_Error404Page.isLoading()) {
          resolve();
          unsub();
          context.loading.setIsLoading(false);
        }
      });
    });
  }

  async componentDidMount(): Promise<void> {
    await _Error404Page.fetchData(this._context, {}, {});
  }

  render(): React.ReactNode {
    return <SiteLayout>Error 404</SiteLayout>;
  }
}

export const Error404Page = connect<_Props, {}, {}, RootAppState>((rootAppState: RootAppState) => ({
  appState: rootAppState.error404,
}))(_Error404Page);
