import { ArrowForwardRounded, StarsRounded } from "@mui/icons-material";
import { Avatar, Box, Button, Chip, Grid, Paper, Skeleton, Stack, Typography } from "@mui/material";
import React from "react";
import { AppContext, ReactAppContextType } from "src/AppContext";
import { getRandomProductIcons } from "src/stateless-components/HomePageProductList";

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
  listHref: string;
  loading: boolean;
};

export class HomePageFeaturedProductList extends React.PureComponent<HomePageFeaturedProductListProps> {
  static contextType = ReactAppContextType;
  get _context() {
    return this.context as AppContext;
  }
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
            <Button variant="text" color="primary" href={product.link}>
              Learn more
            </Button>
            <Button variant="contained" color="primary" endIcon={<ArrowForwardRounded />} href={product.link}>
              Visit
            </Button>
          </Box>
        </Box>
        {this.renderLogo(product.logo, index)}
      </Paper>
    );
  }

  renderSkeleton() {
    return (
      <Box sx={{ width: "100%", mb: 1 }}>
        <Stack spacing={2}>
          <Skeleton variant="rounded" sx={{ borderRadius: 15 }} color="grey.100" height={230} width="100%" />
          <Skeleton variant="rounded" sx={{ borderRadius: 20 }} color="grey.100" height={25} width="40%" />
        </Stack>
      </Box>
    );
  }

  products(): (HomePageFeaturedProductListProduct | null)[] {
    if (this.props.loading) {
      return [null, null];
    }
    return this.props.products;
  }

  render() {
    return (
      <Box>
        <Box display="flex" alignItems="center" justifyContent="center" flexWrap="wrap">
          <Typography variant="h2" my={7} flexGrow={1}>
            {this.props.listTitle}
          </Typography>
          <Button variant="outlined" size="large" color="inherit" href={this.props.listHref}>
            Browse all APIs
          </Button>
        </Box>
        <Grid container spacing={4}>
          {this.products().map((product, idx) => (
            <Grid
              item
              key={product?.pk ?? idx}
              sx={{ height: 310 }}
              xs={
                (this._context.mediaQuery.lg.down && this._context.mediaQuery.md.up) || this._context.mediaQuery.sm.down
                  ? 12
                  : 6
              }
            >
              {this.props.loading ? this.renderSkeleton() : this.renderProductItem(product!, idx)}
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }
}
