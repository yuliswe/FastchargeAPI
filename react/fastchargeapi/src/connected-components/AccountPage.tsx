import DashboardIcon from "@mui/icons-material/Insights";
import SubscriptionIcon from "@mui/icons-material/Replay30";
import MyAppsIcon from "@mui/icons-material/Widgets";
import {
    Box,
    Container,
    Link,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
    Stack,
} from "@mui/material";
import React from "react";
import { connect } from "react-redux";
import { Outlet } from "react-router-dom";
import { AppContext, ReactAppContextType } from "../AppContext";
import { SiteLayout } from "../SiteLayout";
import { MobileMenuItemProps } from "../stateless-components/AppBar";
import { AccountAppState } from "../states/AccountAppState";
import { RootAppState } from "../states/RootAppState";
type Props = {
    appState: AccountAppState;
};

type DashboardLink = MobileMenuItemProps & {
    isActive: boolean;
};

class _AccountPage extends React.Component<Props> {
    static contextType = ReactAppContextType;

    get _context() {
        return this.context as AppContext;
    }

    links(): DashboardLink[] {
        let currentPath = this._context.route?.location.pathname;
        return [
            {
                text: "Dashboard",
                href: "/account",
                isActive: currentPath === "/account",
                icon: <DashboardIcon />,
            },
            {
                text: "My Apps",
                href: "/account/my-apps",
                isActive: currentPath === "/account/my-apps",
                icon: <MyAppsIcon />,
            },
            {
                text: "Subscriptions",
                href: "/account/subscriptions",
                isActive: currentPath === "/account/subscriptions",
                icon: <SubscriptionIcon />,
            },
        ];
    }
    render() {
        return (
            <SiteLayout mobileMenuExtraItems={this.links()}>
                <Container maxWidth="xl">
                    <Stack direction="row" spacing={3} sx={{ display: "flex", mt: 1 }}>
                        {this._context.mediaQuery.md.up && (
                            <Box>
                                <List component={Paper} sx={{ width: 230, maxWidth: 230 }}>
                                    {this.links().map((link) => (
                                        <ListItem key={link.href}>
                                            <ListItemButton
                                                key={link.text}
                                                selected={link.isActive}
                                                component={Link}
                                                color="secondary"
                                                href={link.href}
                                            >
                                                <ListItemIcon>{link.icon}</ListItemIcon>
                                                <ListItemText primary={link.text} />
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        )}
                        <Box
                            sx={{ flexGrow: 1, overflow: "hidden", p: 1 }}
                            style={{ marginTop: this._context.theme.spacing(-1) }}
                        >
                            <Outlet />
                        </Box>
                    </Stack>
                </Container>
            </SiteLayout>
        );
    }
}

export const AccountPage = connect<Props, {}, {}, RootAppState>((rootAppState: RootAppState) => ({
    appState: rootAppState.account,
}))(_AccountPage);
