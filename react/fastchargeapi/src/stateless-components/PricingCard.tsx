import { Card, CardActions, CardContent, Chip, Typography } from "@mui/material";
import React from "react";

export type PricingCardProps = {
    name: string;
    callToAction: string;
    minMonthlyCharge: string;
    chargePerRequest: string;
    freeQuota: number;
    actionButton: React.ReactNode;
    CardProps?: React.ComponentProps<typeof Card>;
};

export class PricingCard extends React.PureComponent<PricingCardProps> {
    constructor(props: PricingCardProps) {
        super(props);
    }
    render() {
        return (
            <Card {...this.props.CardProps} sx={{ p: 2, ...this.props.CardProps?.sx }}>
                <CardContent>
                    <Typography variant="h4" mb={0}>
                        {this.props.name}
                    </Typography>
                    <Typography variant="caption" mb={2} component="div">
                        {this.props.callToAction}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        <Chip
                            color="success"
                            label={`$${this.props.minMonthlyCharge}`}
                            size="small"
                            sx={{ fontSize: "90%" }}
                        />
                        {" during active month + "}
                        <Chip
                            color="warning"
                            label={`$${this.props.chargePerRequest}`}
                            size="small"
                            sx={{ fontSize: "90%" }}
                        />
                        {" per request."}
                    </Typography>
                    <Typography variant="body1">
                        {this.props.freeQuota > 0 ? (
                            <>
                                First{" "}
                                <Chip
                                    color="info"
                                    label={`${this.props.freeQuota}`}
                                    size="small"
                                    sx={{ fontSize: "90%" }}
                                />{" "}
                                requests are free.
                            </>
                        ) : (
                            "No free quota."
                        )}
                    </Typography>
                </CardContent>
                <CardActions>{this.props.actionButton}</CardActions>
            </Card>
        );
    }
}
