import React from "react";
import {
    Box,
    Button,
    ButtonBase,
    Container,
    Icon,
    IconButton,
    InputBase,
    AppBar as MUIAppBar,
    Paper,
    Stack,
    TextField,
    Toolbar,
    Link,
    Typography,
    Menu,
    MenuItem,
    Avatar,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { AppContext, ReactAppContextType } from "../AppContext";
import { createSearchParams } from "react-router-dom";
import { AccountCircle } from "@mui/icons-material";
import firebase from "firebase/compat/app";

type State = {
    searchText: string;
    anchorEl: HTMLElement | null;
};

export class AppBar extends React.Component<{}, State> {
    static contextType = ReactAppContextType;
    get _context(): AppContext {
        return this.context as AppContext;
    }

    constructor(props: {}) {
        super(props);
        this.state = {
            searchText: "",
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
            await firebase.auth().signOut();
            this._context.route?.navigate({
                pathname: "/",
            });
            this.handleClose();
            window.location.reload();
        })();
    };

    componentDidMount(): void {
        this.setState({
            searchText: this._context.route?.query.get("q") || "",
        });
    }
    render() {
        return (
            <Stack>
                <MUIAppBar position="static" sx={{ bgcolor: "primary.main" }}>
                    <Container maxWidth="xl">
                        <Toolbar>
                            <Typography
                                variant="body1"
                                sx={{
                                    flexGrow: 1,
                                }}
                            >
                                Enpowering developers
                            </Typography>
                            <Stack direction="row" spacing={5} mx={5}>
                                <Link href="/#tag-pricing">
                                    <Typography
                                        variant="body1"
                                        color="primary.contrastText"
                                    >
                                        Pricing
                                    </Typography>
                                </Link>
                                <Typography variant="body1" sx={{}}>
                                    Documentation
                                </Typography>
                            </Stack>
                        </Toolbar>
                    </Container>
                </MUIAppBar>
                <MUIAppBar
                    position="static"
                    sx={{ bgcolor: "background.default" }}
                >
                    <Container maxWidth="xl">
                        <Toolbar>
                            <Button href="/" sx={{ p: 2 }}>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                >
                                    <Icon component="img" src="/logo2.png" />
                                    <Typography
                                        variant="h6"
                                        component="div"
                                        color="black"
                                        fontFamily="Ubuntu"
                                        fontWeight="normal"
                                        fontSize={18}
                                    >
                                        FastchargeAPI
                                    </Typography>
                                </Stack>
                            </Button>
                            <Stack
                                direction="row"
                                display="flex"
                                my={1}
                                ml={4}
                                mr={4}
                                flexGrow={1}
                                height={50}
                            >
                                <Paper
                                    sx={{
                                        pl: 1,
                                        py: 0.25,
                                        borderBottomRightRadius: 0,
                                        borderTopRightRadius: 0,
                                        borderBottomLeftRadius: 5,
                                        borderTopLeftRadius: 5,
                                        display: "flex",
                                        bgcolor: "grey.200",
                                        flexGrow: 1,
                                    }}
                                >
                                    <IconButton
                                        type="button"
                                        aria-label="search"
                                    >
                                        <SearchIcon />
                                    </IconButton>
                                    <InputBase
                                        placeholder="Search"
                                        fullWidth
                                        value={this.state.searchText}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter") {
                                                this._context.route?.navigate({
                                                    pathname: "/search",
                                                    search: createSearchParams({
                                                        q: this.state
                                                            .searchText,
                                                    }).toString(),
                                                });
                                            }
                                        }}
                                        onChange={(event) => {
                                            this.setState({
                                                searchText: event.target.value,
                                            });
                                        }}
                                    />
                                </Paper>
                                <Paper
                                    sx={{
                                        bgcolor: "secondary.main",
                                        display: "flex",
                                        borderBottomLeftRadius: 0,
                                        borderTopLeftRadius: 0,
                                        borderTopRightRadius: 5,
                                        borderBottomRightRadius: 5,
                                    }}
                                >
                                    <ButtonBase
                                        component={Link}
                                        sx={{
                                            color: "secondary.contrastText",
                                            px: 2,
                                        }}
                                        href={`/search?q=${this.state.searchText}`}
                                    >
                                        <Typography>Search</Typography>
                                    </ButtonBase>
                                </Paper>
                            </Stack>
                            <Stack>
                                {!this._context.isLoggedIn && (
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
                                {this._context.isLoggedIn && (
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
                                                src={
                                                    this._context.firebase.user
                                                        ?.photoURL || ""
                                                }
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
                                                    // backgroundColor: "background.default",
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
                                            <MenuItem
                                                onClick={this.handleClose}
                                            >
                                                <Link
                                                    href="/account"
                                                    underline="none"
                                                >
                                                    My account
                                                </Link>
                                            </MenuItem>
                                            <MenuItem
                                                onClick={this.handleLogout}
                                            >
                                                Sign out
                                            </MenuItem>
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
