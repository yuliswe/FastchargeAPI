import { ArrowForwardRounded, StarsRounded } from "@mui/icons-material";
import { Avatar, Box, Button, Chip, Grid, Paper, Stack, Typography } from "@mui/material";
import React from "react";
import { getRandomProductIcons } from "./HomePageProductList";

export type HomePageFeaturedProductListProduct = {
    logo: string;
    title: string;
    pk: string;
    description: string;
    link: string;
    tags: string[];
};

const randomProductIcons = getRandomProductIcons(125, 90);

export type HomePageFeaturedProductListProps = {
    listTitle: string;
    products: HomePageFeaturedProductListProduct[];
};

export class HomePageFeaturedProductList extends React.PureComponent<HomePageFeaturedProductListProps> {
    constructor(props: HomePageFeaturedProductListProps) {
        super(props);
    }

    renderLogo(img: string, index: number) {
        if (img) {
            return <Avatar src={img} sx={{ height: 100, width: 100 }} />;
        } else {
            return randomProductIcons[index % randomProductIcons.length];
        }
    }

    renderFeaturedBadge() {
        return <StarsRounded color="warning" sx={{ fontSize: 35 }} />;
    }

    renderProductItem(product: HomePageFeaturedProductListProduct, index: number) {
        return (
            <Paper
                key={product.pk}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    p: 4,
                    bgcolor: "warning.light",
                }}
            >
                <Box flexGrow={1}>
                    <Typography variant="h4" gutterBottom>
                        {product.title}
                    </Typography>
                    <Typography variant="body1">{product.description}</Typography>
                    <Stack direction="row" spacing={2} mt={3} alignItems="center">
                        {/* {this.renderFeaturedBadge()} */}
                        {product.tags.map((tag) => (
                            <Chip key={tag} color="warning" size="medium" label={tag} />
                        ))}
                    </Stack>
                    <Box display="flex" gap={2} alignItems="center" mt={2}>
                        <Button variant="text" color="primary">
                            Learn more
                        </Button>
                        <Button variant="contained" color="primary" endIcon={<ArrowForwardRounded />}>
                            Visit
                        </Button>
                    </Box>
                </Box>
                {this.renderLogo(product.logo, index)}
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
                <Grid container spacing={4}>
                    {this.props.products.map((product, idx) => (
                        <Grid item xs={6}>
                            {this.renderProductItem(product, idx)}
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }
}
