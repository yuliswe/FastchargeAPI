import React from "react";
import { RootAppState } from "../states/RootAppState";
import { connect } from "react-redux";
import { Box } from "@mui/material";
import { MyAppsAppState } from "../states/MyAppsAppState";
type Props = {
    myAppsAppState: MyAppsAppState;
};
class _MyAppsPage extends React.Component<Props> {
    render() {
        return <Box>MyAppsPage</Box>;
    }
}

export const MyAppsPage = connect<Props, {}, {}, RootAppState>(
    (rootAppState: RootAppState) => ({
        myAppsAppState: rootAppState.myApps,
    })
)(_MyAppsPage);
