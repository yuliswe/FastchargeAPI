import React from "react";
import { Helmet } from "react-helmet-async";
import { connect } from "react-redux";
import { HomeAppState } from "../states/HomeAppState";
import { RootAppState } from "../states/RootAppState";

type _State = {
};

type _Props = {
    homeAppState: HomeAppState;
};

class _Home extends React.Component<_Props, _State> {
    constructor(props: _Props) {
        super(props);
        this.state = {};
    }

    render() {
        return (
            <React.Fragment>
                <Helmet>
                    <script src="https://accounts.google.com/gsi/client" async defer></script>
                </Helmet>
                <div>{this.props.homeAppState.welcomeText}</div>
            </React.Fragment>
        );
    }
}

export const HomePage = connect<_Props, {}, {}, RootAppState>((rootAppState: RootAppState) => ({
    homeAppState: rootAppState.home,
}))(_Home);
