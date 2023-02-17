import React from "react";
import { AccountAppState } from "../states/AccountAppState";
import { RootAppState } from "../states/RootAppState";
import { connect } from "react-redux";
import { SiteLayout } from "../SiteLayout";
import {
    Container,
    Divider,
    Grid,
    Link,
    List,
    ListItem,
    Typography,
} from "@mui/material";
import { Outlet } from "react-router-dom";
import { AppContext, ReactAppContextType } from "../AppContext";
type Props = {
    appDetailAppState: AccountAppState;
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
            },
            {
                name: "My Apps",
                href: "/account/my-apps",
                isActive: currentPath === "/account/my-apps",
            },
            {
                name: "Subscriptions",
                href: "/account/subscriptions",
                isActive: currentPath === "/account/subscriptions",
            },
        ];
    }
    render() {
        return (
            <SiteLayout>
                <Container maxWidth="xl">
                    <Grid container>
                        <Grid item xs={2}>
                            <List>
                                {this.links().map((link) => (
                                    <ListItem
                                        key={link.name}
                                        sx={{
                                            px: 4,
                                            my: 2,
                                            py: 0.8,
                                            borderLeftWidth: 3,
                                            borderLeftStyle: "solid",
                                            borderLeftColor: link.isActive
                                                ? "primary.main"
                                                : "transparent",
                                        }}
                                        alignItems="flex-start"
                                    >
                                        <Link href={link.href}>
                                            <Typography
                                                variant="body1"
                                                // color={
                                                //     link.isActive
                                                //         ? "primary.main"
                                                //         : "inherit"
                                                // }
                                            >
                                                {link.name}
                                            </Typography>
                                        </Link>
                                    </ListItem>
                                ))}
                            </List>
                        </Grid>
                        <Grid item xs={10} p={3}>
                            <Outlet />
                        </Grid>
                    </Grid>
                </Container>
            </SiteLayout>
        );
    }
}

export const AccountPage = connect<Props, {}, {}, RootAppState>(
    (rootAppState: RootAppState) => ({
        appDetailAppState: rootAppState.appDetail,
    })
)(_AccountPage);
