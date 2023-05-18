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
                    <Grid container spacing={5} mt={-2} mb={15}>
                        {this._context.mediaQuery.md.up && (
                            <Grid item xl={2.25} lg={2.75} md={3.5}>
                                <List component={Paper}>
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
                            </Grid>
                        )}
                        <Grid item xl={9.75} lg={9.25} md={8.5} sm={12}>
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
