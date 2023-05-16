import { Box } from "@mui/material";
import React from "react";
import { AppContext, ReactAppContextType } from "./AppContext";
import { SiteFooter } from "./connected-components/SiteFooter";
import { AppBar } from "./stateless-components/AppBar";
type Props = {
    children: React.ReactNode;
    onSearch?: (query: string) => void;
    bgcolor?: string;
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
                <AppBar onSearch={this.props.onSearch} bgcolor={this.props.bgcolor} />
                <Box component="main" sx={{ bgcolor: this.props.bgcolor }}>
                    {this.props.children}
                </Box>
                <SiteFooter />
            </React.Fragment>
        );
    }
}
