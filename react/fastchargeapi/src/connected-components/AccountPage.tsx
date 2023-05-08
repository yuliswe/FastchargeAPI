import DashboardIcon from "@mui/icons-material/Insights";
import SubscriptionIcon from "@mui/icons-material/Replay30";
import MyAppsIcon from "@mui/icons-material/Widgets";
import {
    Container,
    Grid,
    Link,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
} from "@mui/material";
import React from "react";
import { connect } from "react-redux";
import { Outlet } from "react-router-dom";
import { AppContext, ReactAppContextType } from "../AppContext";
import { SiteLayout } from "../SiteLayout";
import { AccountAppState } from "../states/AccountAppState";
import { RootAppState } from "../states/RootAppState";
type Props = {
    appState: AccountAppState;
};
class _AccountPage extends React.Component<Props> {
    static contextType = ReactAppContextType;

    get _context() {
        return this.context as AppContext;
    }

    links() {
        let currentPath = this._context.route?.location.pathname;
        return [
            {
                name: "Dashboard",
                href: "/account",
                isActive: currentPath === "/account",
                icon: <DashboardIcon />,
            },
            {
                name: "My Apps",
                href: "/account/my-apps",
                isActive: currentPath === "/account/my-apps",
                icon: <MyAppsIcon />,
            },
            {
                name: "Subscriptions",
                href: "/account/subscriptions",
                isActive: currentPath === "/account/subscriptions",
                icon: <SubscriptionIcon />,
            },
        ];
    }
    render() {
        return (
            <SiteLayout>
                <Container maxWidth="xl">
                    <Grid container spacing={5} mt={-2} mb={15}>
                        <Grid item xs={2}>
                            <List component={Paper} sx={{ p: 2, borderRadius: 10 }} elevation={1}>
                                {this.links().map((link) => (
                                    <ListItem key={link.href} disablePadding>
                                        <ListItemButton
                                            key={link.name}
                                            selected={link.isActive}
                                            component={Link}
                                            color="secondary"
                                            href={link.href}
                                        >
                                            <ListItemIcon>{link.icon}</ListItemIcon>
                                            <ListItemText primary={link.name} />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </Grid>
                        <Grid item xs={10}>
                            <Outlet />
                        </Grid>
                    </Grid>
                </Container>
            </SiteLayout>
        );
    }
}

export const AccountPage = connect<Props, {}, {}, RootAppState>((rootAppState: RootAppState) => ({
    appState: rootAppState.account,
}))(_AccountPage);
