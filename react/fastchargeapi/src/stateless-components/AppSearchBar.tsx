import React from "react";
import { AppContext, ReactAppContextType } from "../AppContext";
import { RouteURL } from "../routes";
import { SearchBar } from "./SearchBar";
type _State = {};

type _Props = {
  onSearch?: (query: string) => void;
};

export class AppSearchBar extends React.Component<_Props, _State> {
  static contextType = ReactAppContextType;
  get _context(): AppContext {
    return this.context as AppContext;
  }

  render() {
    return (
      <SearchBar
        showSearchButton={this._context.mediaQuery.sm.up}
        searchText={this._context.route?.query.get("q") || ""}
        onSearch={(query) => {
          if (this.props.onSearch) {
            this.props.onSearch(query);
          } else {
            this._context.route.navigate(
              RouteURL.searchResultPage({
                query: {
                  q: query,
                },
              })
            );
          }
        }}
      />
    );
  }
}
