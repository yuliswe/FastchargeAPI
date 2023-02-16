import { Box, Typography } from "@mui/material";
import React from "react";

export class Banner extends React.PureComponent {
    render() {
        return (
            <React.Fragment>
                <div className="banner">
                    <h1>Welcome to my website</h1>
                    <p>Explore the world of art and creativity with us!</p>
                </div>
            </React.Fragment>
        );
    }
}
