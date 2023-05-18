import {
    AccessTimeFilledRounded,
    AccountBalanceRounded,
    AdbRounded,
    AdsClickRounded,
    ArrowForwardRounded,
    PsychologyAltRounded,
    SportsMotorsportsRounded,
    StarsRounded,
} from "@mui/icons-material";
import { Avatar, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import React from "react";

export function getRandomProductIcons(avatarSize: number, iconSize: number) {
    return [
        <Avatar sx={{ height: avatarSize, width: avatarSize }}>
            <AdbRounded sx={{ height: iconSize, width: iconSize }} />
        </Avatar>,
        <Avatar sx={{ height: avatarSize, width: avatarSize }}>
            <AccountBalanceRounded sx={{ height: iconSize, width: iconSize }} />
        </Avatar>,
        <Avatar sx={{ height: avatarSize, width: avatarSize }}>
            <AdsClickRounded sx={{ height: iconSize, width: iconSize }} />
        </Avatar>,
        <Avatar sx={{ height: avatarSize, width: avatarSize }}>
            <SportsMotorsportsRounded sx={{ height: iconSize, width: iconSize }} />
        </Avatar>,
        <Avatar sx={{ height: avatarSize, width: avatarSize }}>
            <PsychologyAltRounded sx={{ height: iconSize, width: iconSize }} />
        </Avatar>,
        <Avatar sx={{ height: avatarSize, width: avatarSize }}>
            <AccessTimeFilledRounded sx={{ height: iconSize, width: iconSize }} />
        </Avatar>,
    ];
}

const randomProductIconsOffset = 2; // First 2 icons are used by HomePageFeaturedProductList
const randomProductIcons = getRandomProductIcons(75, 50).slice(2);

export type HomePageProductListProduct = {
    logo: string;
    title: string;
    pk: string;
    description: string;
    link: string;
    tags: string[];
};

export type HomePageProductListProps = {
    listTitle: string;
    useFeaturedListStyle?: boolean;
    products: HomePageProductListProduct[];
};

export class HomePageProductList extends React.PureComponent<HomePageProductListProps> {
    constructor(props: HomePageProductListProps) {
        super(props);
    }

    renderLogo(img: string, index: number) {
        if (img) {
            return <Avatar src={img} sx={{ height: 75, width: 75 }} />;
        } else {
            return randomProductIcons[index % randomProductIcons.length];
        }
    }

    renderFeaturedBadge() {
        return <StarsRounded color="warning" sx={{ fontSize: 35 }} />;
    }

    renderProductItem(product: HomePageProductListProduct, index: number) {
        return (
            <Paper
                key={product.pk}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    p: 3,
                    border: "1px solid",
                    borderColor: this.props.useFeaturedListStyle ? "warning.main" : "transparent",
                    bgcolor: this.props.useFeaturedListStyle ? "warning.light" : "transparent",
                }}
            >
                {this.renderLogo(product.logo, index)}
                <Box mx={4} flexGrow={1}>
                    <Typography variant="h5">{product.title}</Typography>
                    <Typography variant="body1">{product.description}</Typography>
                    <Stack direction="row" spacing={2} mt={2} alignItems="center">
                        {this.props.useFeaturedListStyle && this.renderFeaturedBadge()}
                        {product.tags.map((tag) => (
                            <Chip key={tag} color="primary" size="small" label={tag} />
                        ))}
                    </Stack>
                </Box>
                <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center" alignItems="center">
                    <Button variant="text">Learn more</Button>
                    <Button variant="contained" endIcon={<ArrowForwardRounded />}>
                        Visit
                    </Button>
                </Box>
            </Paper>
        );
    }

    render() {
        return (
            <Box>
                <Box display="flex" alignItems="center" justifyContent="center">
                    <Typography variant="h2" my={7} flexGrow={1}>
                        {this.props.listTitle}
                    </Typography>
                    <Button variant="outlined" size="large" color="inherit">
                        Browse all APIs
                    </Button>
                </Box>
                <Stack spacing={2}>
                    {this.props.products.map((product, idx) => this.renderProductItem(product, idx))}
                </Stack>
            </Box>
        );
    }
}
