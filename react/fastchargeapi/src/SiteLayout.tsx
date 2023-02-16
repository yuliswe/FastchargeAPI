import {
    Box,
    Container,
    CssBaseline,
    Paper,
    ThemeProvider,
    createTheme,
} from "@mui/material";
import React from "react";
import { AppBar } from "./stateless-components/AppBar";
import { Helmet } from "react-helmet-async";
import { AppContext, ReactAppContextType } from "./AppContext";

type Props = {
    children: React.ReactNode;
};

export class SiteLayout extends React.PureComponent<Props> {
    static contextType = ReactAppContextType;
    get _context(): AppContext {
        return this.context as AppContext;
    }

    render() {
        return (
            <React.Fragment>
                <AppBar></AppBar>
                {this.props.children}
                <Paper sx={{ mt: 15, bgcolor: "primary.main", p: 5 }}>
                    ???
                </Paper>
            </React.Fragment>
        );
    }
}
