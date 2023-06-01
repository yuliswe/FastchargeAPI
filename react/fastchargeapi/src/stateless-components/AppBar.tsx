import {
    Avatar,
    Box,
    Button,
    Container,
    Drawer,
    IconButton,
    Link,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
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

import MenuIcon from "@mui/icons-material/Menu";
import { RouteURL } from "../routes";

type State = {
    accountButtonEl: HTMLElement | null;
    openMainMenu: boolean;
};

type Props = {
    onSearch?: (searchText: string) => void;
    bgcolor?: string;
    mobileMenuExtraItems?: MobileMenuItemProps[];
};

export type MobileMenuItemProps = {
    text: string;
    href: string;
    target?: string;
    icon?: React.ReactNode;
};

export class AppBar extends React.Component<Props, State> {
    static contextType = ReactAppContextType;
    get _context(): AppContext {
        return this.context as AppContext;
    }

    constructor(props: {}) {
        super(props);
        this.state = {
            accountButtonEl: null,
            openMainMenu: false,
        };
    }

    handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // setAuth(event.target.checked);
    };

    handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        this.setState({
            accountButtonEl: event.currentTarget,
        });
    };

    handleClose = () => {
        this.setState({
            accountButtonEl: null,
        });
    };

    handleLogout = () => {
        void (async () => {
            await getAuth().signOut();
            document.location.href = "/";
        })();
    };

    renderLogo() {
        return (
            <Button
                href={RouteURL.homePage()}
                variant="text"
                startIcon={<Logo style={{ width: 35 }} />}
                sx={{
                    display: "none",
                    [this._context.theme.breakpoints.up("lg")]: {
                        display: "flex",
                    },
                }}
            >
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

    renderSmallLogo() {
        return (
            <IconButton
                href={RouteURL.homePage()}
                sx={{
                    display: this._context.mediaQuery.md.only ? "inline-flex" : "none",
                }}
            >
                <Logo style={{ width: 42, height: 42 }} />
            </IconButton>
        );
    }

    appBarElRef = React.createRef<HTMLDivElement>();

    closeMenu() {
        this.setState({
            openMainMenu: false,
        });
    }

    openMainMenu() {
        this.setState({
            openMainMenu: true,
        });
    }

    mainMenuLinks: MobileMenuItemProps[] = [
        {
            text: "Pricing",
            href: RouteURL.termsPage(),
            target: "_self",
        },
        {
            text: "Documentation",
            href: RouteURL.documentationPage(),
            target: "_self",
        },
    ];

    profileMenuLinks: MobileMenuItemProps[] = [
        {
            text: "My account",
            href: RouteURL.accountPage(),
            target: "_self",
        },
    ];

    loginHref() {
        return `/auth?redirect=${this._context.route.locationHref}`;
    }

    renderAvatar() {
        return (
            <Avatar
                sizes="large"
                sx={{
                    boxShadow: 5,
                    width: 46,
                    height: 46,
                }}
                src={this._context.firebase.user?.photoURL || ""}
            />
        );
    }

    renderMobileMenuButton() {
        return (
            <IconButton
                size="large"
                edge="start"
                color="secondary"
                aria-label="menu"
                onClick={() => this.openMainMenu()}
                sx={{
                    display: this._context.mediaQuery.md.down ? "inline-flex" : "none",
                }}
            >
                {this._context.firebase.isAnonymousUser ? <MenuIcon /> : this.renderAvatar()}
            </IconButton>
        );
    }

    renderToolbarMenu() {
        return (
            <Stack
                ml={4}
                direction="row"
                alignItems="center"
                spacing={3}
                display={this._context.mediaQuery.md.down ? "none" : "initial"}
            >
                <Link
                    key="/"
                    target="_self"
                    href={RouteURL.homePage()}
                    display={this._context.mediaQuery.lg.up ? "initial" : "none"}
                >
                    Home
                </Link>
                {this.mainMenuLinks.map((link) => (
                    <Link key={link.text} href={link.href} target={link.target ?? "_self"}>
                        {link.text}
                    </Link>
                ))}
            </Stack>
        );
    }

    renderSignInButton() {
        return (
            <Stack
                sx={{
                    display: this._context.mediaQuery.md.up ? "flex" : "none",
                    ml: 4,
                }}
            >
                {this._context.firebase.isAnonymousUser && (
                    <Button sx={{ color: "text.primary", p: 2 }} href={this.loginHref()}>
                        <Typography noWrap>Sign In</Typography>
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
                            {this.renderAvatar()}
                        </Button>
                        <Menu
                            id="menu-appbar"
                            anchorEl={this.state.accountButtonEl}
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "right",
                            }}
                            PaperProps={{
                                elevation: 5,
                                sx: {
                                    backgroundColor: "grey.100",
                                    borderRadius: 10,
                                },
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: "top",
                                horizontal: "right",
                            }}
                            open={Boolean(this.state.accountButtonEl)}
                            onClose={this.handleClose}
                        >
                            {this.profileMenuLinks.map((link) => (
                                <MenuItem key={link.text} href={link.href} component={Link}>
                                    <ListItemText primary={link.text} />
                                </MenuItem>
                            ))}
                            <MenuItem onClick={this.handleLogout} component={Link}>
                                <ListItemText primary="Sign out" />
                            </MenuItem>
                        </Menu>
                    </React.Fragment>
                )}
            </Stack>
        );
    }

    renderMobileDrawerMenu() {
        return (
            <Drawer
                anchor="bottom"
                open={this.state.openMainMenu}
                onClose={() => this.closeMenu()}
                PaperProps={{
                    sx: {
                        borderRadius: 0,
                        borderTopLeftRadius: 10,
                        borderTopRightRadius: 10,
                    },
                }}
            >
                <List>
                    <ListItemButton key={"Sign in"} onClick={() => this.closeMenu()}>
                        <ListItemIcon>
                            <Logo />
                        </ListItemIcon>
                        <ListItemText
                            primary={"FastchargeAPI"}
                            primaryTypographyProps={{
                                variant: "h5",
                            }}
                        />
                    </ListItemButton>
                    <ListItemButton href={"/"} key={"Home"} onClick={() => this.closeMenu()} component={Link}>
                        <ListItemText primary={"Home"} />
                    </ListItemButton>
                    {this.mainMenuLinks.map((link, index) => (
                        <ListItemButton
                            component={Link}
                            href={link.href}
                            key={link.text}
                            target={link.target ?? "_self"}
                            onClick={() => this.closeMenu()}
                        >
                            {link.icon && <ListItemIcon>{link.icon}</ListItemIcon>}
                            <ListItemText primary={link.text} />
                        </ListItemButton>
                    ))}
                    {this.profileMenuLinks.map((link, index) => (
                        <ListItemButton
                            component={Link}
                            href={link.href}
                            key={link.text}
                            target={link.target ?? "_self"}
                            onClick={() => this.closeMenu()}
                            divider={index === this.profileMenuLinks.length - 1}
                        >
                            {link.icon && <ListItemIcon>{link.icon}</ListItemIcon>}
                            <ListItemText primary={link.text} />
                        </ListItemButton>
                    ))}
                    {this.props.mobileMenuExtraItems &&
                        this.props.mobileMenuExtraItems.map((link, index) => (
                            <ListItemButton
                                component={Link}
                                href={link.href}
                                key={link.text}
                                target={link.target ?? "_self"}
                                onClick={() => this.closeMenu()}
                                divider={index === this.props.mobileMenuExtraItems!.length - 1}
                            >
                                {link.icon && <ListItemIcon>{link.icon}</ListItemIcon>}
                                <ListItemText primary={link.text} />
                            </ListItemButton>
                        ))}
                    {this._context.firebase.isAnonymousUser ? (
                        <ListItemButton
                            href={this.loginHref()}
                            key={"Sign in"}
                            onClick={() => this.closeMenu()}
                            component={Link}
                        >
                            <ListItemText primary={"Sign in"} />
                        </ListItemButton>
                    ) : (
                        <ListItemButton
                            component={Link}
                            href={this.loginHref()}
                            key={"Sign out"}
                            onClick={() => {
                                this.closeMenu();
                                this.handleLogout();
                            }}
                        >
                            <ListItemText primary={"Sign out"} />
                        </ListItemButton>
                    )}
                </List>
            </Drawer>
        );
    }

    render() {
        return (
            <React.Fragment>
                <Stack>
                    <MUIAppBar
                        ref={this.appBarElRef}
                        position="static"
                        sx={{
                            bgcolor: "background.default",
                            py: 1,
                        }}
                        elevation={0}
                    >
                        <Container maxWidth="xl">
                            <Toolbar>
                                {this.renderLogo()}
                                {this.renderSmallLogo()}
                                {this.renderMobileMenuButton()}
                                <Box my={1} ml={4} flexGrow={1}>
                                    <AppSearchBar onSearch={this.props.onSearch} />
                                </Box>
                                {this.renderToolbarMenu()}
                                {this.renderSignInButton()}
                            </Toolbar>
                        </Container>
                    </MUIAppBar>
                </Stack>
                {this.renderMobileDrawerMenu()}
            </React.Fragment>
        );
    }
}
