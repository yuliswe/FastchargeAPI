import {
    Avatar,
    Box,
    Button,
    Container,
    Link,
    AppBar as MUIAppBar,
    Menu,
    MenuItem,
    Stack,
    Toolbar,
    Typography,
} from "@mui/material";
import { getAuth } from "firebase/auth";
import React from "react";
import { AppContext, ReactAppContextType } from "../AppContext";
import { ReactComponent as Logo } from "../svg/logo5.svg";
import { AppSearchBar } from "./AppSearchBar";

type State = {
    anchorEl: HTMLElement | null;
};

type Props = {
    onSearch?: (searchText: string) => void;
    bgcolor?: string;
};

export class AppBar extends React.Component<Props, State> {
    static contextType = ReactAppContextType;
    get _context(): AppContext {
        return this.context as AppContext;
    }

    constructor(props: {}) {
        super(props);
        this.state = {
            anchorEl: null,
        };
    }

    handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // setAuth(event.target.checked);
    };

    handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        this.setState({
            anchorEl: event.currentTarget,
        });
    };

    handleClose = () => {
        this.setState({
            anchorEl: null,
        });
    };

    handleLogout = (event: React.MouseEvent<HTMLElement>) => {
        void (async () => {
            await getAuth().signOut();
            document.location.href = "/";
        })();
    };

    renderLogo() {
        return (
            <Button href="/" variant="text" startIcon={<Logo style={{ width: 35 }} />} sx={{ px: 2 }}>
                <Typography
                    variant="body1"
                    component="div"
                    fontFamily="Ubuntu"
                    fontSize={20}
                    fontWeight={500}
                    color="text.primary"
                >
                    FastchargeAPI
                </Typography>
            </Button>
        );
    }

    render() {
        return (
            <Stack>
                <MUIAppBar
                    position="static"
                    sx={{
                        bgcolor: "background.default",
                        py: 1,
                    }}
                    elevation={0}
                >
                    <Container maxWidth="xl">
                        <Toolbar sx={{ px: "0 !important" }}>
                            {this.renderLogo()}
                            <Stack direction="row" alignItems="center" spacing={3} ml={5}>
                                <Link href="/">Home</Link>
                                <Link href="/terms-of-service#pricing">Pricing</Link>
                                <Link href="https://doc.fastchargeapi.com" target="_blank">
                                    Documentation
                                </Link>
                            </Stack>
                            <Box my={1} ml={4} mr={4} flexGrow={1}>
                                <AppSearchBar />
                            </Box>
                            <Stack>
                                {this._context.firebase.isAnonymousUser && (
                                    <Button
                                        sx={{
                                            color: "black",
                                            p: 2,
                                            borderRadius: 5,
                                        }}
                                        href={`/auth?redirect=${this._context.route.locationHref}`}
                                    >
                                        <Typography>Sign In</Typography>
                                    </Button>
                                )}
                                {!this._context.firebase.isAnonymousUser && (
                                    <React.Fragment>
                                        <Button
                                            size="small"
                                            aria-label="account of current user"
                                            aria-controls="menu-appbar"
                                            aria-haspopup="true"
                                            onClick={this.handleMenu}
                                            color="inherit"
                                            sx={{
                                                p: 1.25,
                                                borderRadius: "50%",
                                                minWidth: "inherit",
                                            }}
                                        >
                                            <Avatar
                                                sizes="large"
                                                sx={{
                                                    boxShadow: 1,
                                                }}
                                                src={this._context.firebase.user?.photoURL || ""}
                                            />
                                        </Button>
                                        <Menu
                                            id="menu-appbar"
                                            anchorEl={this.state.anchorEl}
                                            anchorOrigin={{
                                                vertical: "bottom",
                                                horizontal: "right",
                                            }}
                                            PaperProps={{
                                                elevation: 1,
                                                sx: {
                                                    backgroundColor: "grey.100",
                                                    borderRadius: 5,
                                                },
                                            }}
                                            keepMounted
                                            transformOrigin={{
                                                vertical: "top",
                                                horizontal: "right",
                                            }}
                                            open={Boolean(this.state.anchorEl)}
                                            onClose={this.handleClose}
                                        >
                                            <MenuItem onClick={this.handleClose}>
                                                <Link href="/account" underline="none">
                                                    My account
                                                </Link>
                                            </MenuItem>
                                            <MenuItem onClick={this.handleLogout}>Sign out</MenuItem>
                                        </Menu>
                                    </React.Fragment>
                                )}
                            </Stack>
                        </Toolbar>
                    </Container>
                </MUIAppBar>
            </Stack>
        );
    }
}
