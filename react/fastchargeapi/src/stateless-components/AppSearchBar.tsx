import React from "react";
import { createSearchParams } from "react-router-dom";
import { AppContext, ReactAppContextType } from "../AppContext";
import { SearchBar } from "./SearchBar";

type _State = {};

type _Props = {};

export class AppSearchBar extends React.Component<_Props, _State> {
    static contextType = ReactAppContextType;
    get _context(): AppContext {
        return this.context as AppContext;
    }

    render() {
        return (
            <SearchBar
                searchText={this._context.route?.query.get("q") || ""}
                onSearch={(query) => {
                    console.log("searching for", query);
                    this._context.route?.navigate({
                        pathname: "/search",
                        search: createSearchParams({
                            q: query,
                        }).toString(),
                    });
                }}
            />
        );
    }
}
