import {
    Card,
    CardContent,
    Typography,
    CardActions,
    Button,
} from "@mui/material";
import React from "react";

export type PricingCardProps = {
    name: string;
    description: string;
    minMonthlyCharge: string;
    chargePerCall: string;
    freeQuota: number;
    actionButton: React.ReactNode;
};

export class PricingCard extends React.PureComponent<PricingCardProps> {
    render() {
        return (
            <Card sx={{ p: 2, borderRadius: 5 }}>
                <CardContent>
                    <Typography variant="h6" mb={2}>
                        {this.props.name}
                    </Typography>
                    <Typography variant="body1" mb={1}>
                        {this.props.description}
                    </Typography>
                    <Typography variant="body1">
                        ${this.props.chargePerCall} per request
                    </Typography>
                    <Typography>
                        + ${this.props.minMonthlyCharge} per active month
                    </Typography>
                    <Typography variant="body1">
                        First {this.props.freeQuota} requests are free.
                    </Typography>
                </CardContent>
                <CardActions>{this.props.actionButton}</CardActions>
            </Card>
        );
    }
}
