import {
    Box,
    Button,
    Container,
    CssBaseline,
    Grid,
    Link,
    Paper,
    Stack,
    ThemeProvider,
    Typography,
    createTheme,
} from "@mui/material";
import React from "react";
import { AppBar } from "./stateless-components/AppBar";
import { AppContext, ReactAppContextType } from "./AppContext";
import CopyrightIcon from "@mui/icons-material/Copyright";
import HeartIcon from "@mui/icons-material/Favorite";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import GitHubIcon from "@mui/icons-material/GitHub";
type Props = {
    children: React.ReactNode;
    onSearch?: (query: string) => void;
};

export class SiteLayout extends React.PureComponent<Props> {
    static contextType = ReactAppContextType;
    get _context(): AppContext {
        return this.context as AppContext;
    }

    render() {
        return (
            <React.Fragment>
                <AppBar onSearch={this.props.onSearch} />
                {this.props.children}
                <Paper sx={{ mt: 15, bgcolor: "primary.main", p: 5 }}>
                    <Container maxWidth="lg">
                        <Grid container>
                            <Grid item xs={3}>
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
                            <Grid item xs={3}>
                                <Stack>
                                    <Link
                                        underline="hover"
                                        href="/terms-of-service#pricing"
                                    >
                                        Pricing
                                    </Link>
                                    <Link
                                        underline="hover"
                                        href="https://doc.fastchargeapi.com"
                                        target="_blank"
                                    >
                                        <Typography variant="body1">
                                            Documentation
                                        </Typography>
                                    </Link>
                                </Stack>
                            </Grid>
                            <Grid item xs={3}>
                                <Stack>
                                    <Link
                                        href="https://github.com/FastchargeAPI/fastchargeapi-cli/issues"
                                        target="_blank"
                                        underline="hover"
                                        display="flex"
                                        alignItems="center"
                                    >
                                        Report an Issue
                                    </Link>
                                    <Link
                                        href="https://discord.gg/sfN267KmmW"
                                        underline="hover"
                                        target="_blank"
                                    >
                                        Get help on Discord
                                    </Link>
                                </Stack>
                            </Grid>
                            <Grid item xs={3}>
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
                                        Terms of Service
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
