import React from "react";
import {
    Button,
    ButtonBase,
    Container,
    Icon,
    IconButton,
    InputBase,
    AppBar as MUIAppBar,
    Paper,
    Stack,
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
import { getAuth } from "firebase/auth";

type State = {
    searchText: string;
    anchorEl: HTMLElement | null;
};

type Props = {
    onSearch?: (searchText: string) => void;
};

export class AppBar extends React.Component<Props, State> {
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
            await getAuth().signOut();
            document.location.href = "/";
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
                            <Link
                                sx={{
                                    flexGrow: 1,
                                }}
                            >
                                <Typography variant="body1">Enpowering developers</Typography>
                            </Link>
                            <Stack direction="row" spacing={5} ml={5}>
                                <Link href="/#tag-pricing">
                                    <Typography variant="body1" color="primary.contrastText">
                                        Pricing
                                    </Typography>
                                </Link>
                                <Link href="https://doc.fastchargeapi.com" target="_blank">
                                    <Typography variant="body1" sx={{}}>
                                        Documentation
                                    </Typography>
                                </Link>
                            </Stack>
                        </Toolbar>
                    </Container>
                </MUIAppBar>
                <MUIAppBar position="static" sx={{ bgcolor: "background.default" }}>
                    <Container maxWidth="xl">
                        <Toolbar>
                            <Button href="/" sx={{ p: 2 }}>
                                <Stack direction="row" spacing={1} alignItems="center">
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
                            <Stack direction="row" display="flex" my={1} ml={4} mr={4} flexGrow={1} height={50}>
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
                                    <IconButton type="button" aria-label="search">
                                        <SearchIcon />
                                    </IconButton>
                                    <InputBase
                                        placeholder="Search app"
                                        fullWidth
                                        value={this.state.searchText}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter") {
                                                this.props.onSearch?.(this.state.searchText);
                                                this._context.route?.navigate({
                                                    pathname: "/search",
                                                    search: createSearchParams({
                                                        q: this.state.searchText,
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
                                        onClick={() => {
                                            this.props.onSearch?.(this.state.searchText);
                                        }}
                                    >
                                        <Typography>Search</Typography>
                                    </ButtonBase>
                                </Paper>
                            </Stack>
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
