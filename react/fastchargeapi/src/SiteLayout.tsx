import { Box, LinearProgress } from "@mui/material";
import React from "react";
import { AppContext, ReactAppContextType } from "./AppContext";
import { SiteFooter } from "./connected-components/SiteFooter";
import { AppBar, MobileMenuItemProps } from "./stateless-components/AppBar";
type Props = {
    children: React.ReactNode;
    onSearch?: (query: string) => void;
    bgcolor?: string;
    mobileMenuExtraItems?: MobileMenuItemProps[];
};

export class SiteLayout extends React.PureComponent<Props> {
    static contextType = ReactAppContextType;
    get _context(): AppContext {
        return this.context as AppContext;
    }

    constructor(props: Props) {
        super(props);
    }

    render() {
        return (
            <React.Fragment>
                {this._context.loading.isLoading && (
                    <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, overflow: "visible", zIndex: 99999 }}>
                        <LinearProgress />
                    </Box>
                )}
                <AppBar
                    onSearch={this.props.onSearch}
                    bgcolor={this.props.bgcolor}
                    mobileMenuExtraItems={this.props.mobileMenuExtraItems}
                />
                <Box component="main" sx={{ bgcolor: this.props.bgcolor }}>
                    {this.props.children}
                </Box>
                <SiteFooter />
            </React.Fragment>
        );
    }
}
