import {
    Box,
    Container,
    CssBaseline,
    Grid,
    Link,
    Paper,
    Stack,
    ThemeProvider,
    createTheme,
} from "@mui/material";
import React from "react";
import { AppBar } from "./stateless-components/AppBar";
import { AppContext, ReactAppContextType } from "./AppContext";
import CopyrightIcon from "@mui/icons-material/Copyright";
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
                    <Container maxWidth="xl">
                        <Grid container>
                            <Grid item xs={2}>
                                <Stack>
                                    <Link
                                        underline="hover"
                                        href="/terms-of-service#pricing"
                                    >
                                        Pricing
                                    </Link>
                                    <Link>Documentation</Link>
                                </Stack>
                            </Grid>
                            <Grid item xs={2}>
                                <Stack>
                                    <Link>Report an Issue</Link>
                                    <Link>Get help on Discord</Link>
                                </Stack>
                            </Grid>
                            <Grid item xs={2}>
                                <Stack>
                                    <Link
                                        underline="hover"
                                        href="/terms-of-service#privacy"
                                    >
                                        Privacy
                                    </Link>
                                    <Link
                                        underline="hover"
                                        href="/terms-of-service#tos"
                                    >
                                        Terms & Services
                                    </Link>
                                </Stack>
                            </Grid>
                            <Grid item xs={2}>
                                <Stack>
                                    <Link
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                        }}
                                    >
                                        <CopyrightIcon
                                            sx={{ fontSize: 16, mr: 0.5 }}
                                        />
                                        FastchargeAPI
                                    </Link>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Container>
                </Paper>
            </React.Fragment>
        );
    }
}
