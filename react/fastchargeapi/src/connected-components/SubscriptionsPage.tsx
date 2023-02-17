import React from "react";
import { RootAppState } from "../states/RootAppState";
import { connect } from "react-redux";
import { Box } from "@mui/material";
import { SubscriptionsAppState } from "../states/SubscriptionsAppState";
type Props = {
    subscriptionsAppState: SubscriptionsAppState;
};
class _SubscriptionsPage extends React.Component<Props> {
    render() {
        return <Box>SubscriptionsPage</Box>;
    }
}

export const SubscriptionsPage = connect<Props, {}, {}, RootAppState>(
    (rootAppState: RootAppState) => ({
        subscriptionsAppState: rootAppState.appDetail,
    })
)(_SubscriptionsPage);
