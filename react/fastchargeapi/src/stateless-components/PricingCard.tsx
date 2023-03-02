import {
    Card,
    CardContent,
    Typography,
    CardActions,
    Button,
    Stack,
} from "@mui/material";
import React from "react";

export type PricingCardProps = {
    name: string;
    callToAction: string;
    minMonthlyCharge: string;
    chargePerRequest: string;
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
                        {this.props.callToAction}
                    </Typography>
                    <Typography variant="body1">
                        ${this.props.chargePerRequest} per request
                    </Typography>
                    <Typography>
                        + ${this.props.minMonthlyCharge} per active month
                    </Typography>
                    <Typography variant="body1">
                        {this.props.freeQuota > 0
                            ? `First ${this.props.freeQuota} requests are free.`
                            : "No free quota."}
                    </Typography>

                    <Typography variant="caption">
                        {this.props.callToAction}
                    </Typography>
                </CardContent>
                <CardActions>{this.props.actionButton}</CardActions>
            </Card>
        );
    }
}
