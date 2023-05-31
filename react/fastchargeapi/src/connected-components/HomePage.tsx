import {
    ArrowForwardRounded,
    ArrowUpwardRounded,
    LabelRounded,
    PersonalVideoRounded,
    TipsAndUpdatesRounded,
} from "@mui/icons-material";
import {
    Avatar,
    Box,
    Button,
    Card,
    CardActionArea,
    CardActions,
    CardContent,
    CardMedia,
    Chip,
    Container,
    Grid,
    Link,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import React from "react";
import { connect } from "react-redux";
import { AppContext, ReactAppContextType } from "../AppContext";
import { SiteLayout } from "../SiteLayout";
import { HomePageEvent } from "../events/HomePageEvent";
import { RouteURL } from "../routes";
import { AppSearchBar } from "../stateless-components/AppSearchBar";
import { HomePageBanner2 } from "../stateless-components/HomePageBanner2";
import { HomePageFeaturedProductList } from "../stateless-components/HomePageFeaturedProducList";
import { HomePageProductList } from "../stateless-components/HomePageProductList";
import { HomePagePublisherTutorialCarousel } from "../stateless-components/HomePagePublisherTutorialCarousel";
import { HomeAppState } from "../states/HomeAppState";
import { RootAppState } from "../states/RootAppState";
import { appStore } from "../store-config";
import { ReactComponent as AppDrawingBoardIcon } from "../svg/drawing-board.svg";
import { ReactComponent as MakeMoneyIcon } from "../svg/make-money.svg";
import { ReactComponent as MobileProgrammerIcon } from "../svg/mobile-programmer.svg";
import { ReactComponent as PublishAPIIcon } from "../svg/publish-app.svg";
import { ReactComponent as SetAPriceIcon } from "../svg/set-a-price.svg";
type _State = {};

type _Props = {
    homeAppState: HomeAppState;
};

class _Home extends React.Component<_Props, _State> {
    constructor(props: _Props) {
        super(props);
        this.state = {};
    }
    static contextType = ReactAppContextType;
    get _context() {
        return this.context as AppContext;
    }

    componentDidMount(): void {
        appStore.dispatch(new HomePageEvent.LoadLatestProducts(this._context));
        appStore.dispatch(new HomePageEvent.LoadFeaturedProducts(this._context));
        appStore.dispatch(new HomePageEvent.LoadCategories(this._context));
    }

    renderProductLists() {
        return (
            <React.Fragment>
                <HomePageFeaturedProductList
                    listTitle="Featured APIs"
                    loading={this.props.homeAppState.loadingFeaturedProducts}
                    products={this.props.homeAppState.featuredProducts}
                    listHref={RouteURL.searchResultPage({
                        query: {
                            tag: "Featured",
                            sort: "recent",
                        },
                    })}
                />
                <HomePageProductList
                    listTitle="Latest APIs"
                    loading={this.props.homeAppState.loadingLatestProducts}
                    products={this.props.homeAppState.latestProducts}
                    listHref={RouteURL.searchResultPage({
                        query: {
                            tag: "Latest",
                            sort: "recent",
                        },
                    })}
                />
            </React.Fragment>
        );
    }

    renderCategoryList() {
        const icons: { [title: string]: JSX.Element } = {
            Development: <PersonalVideoRounded />,
        };
        return (
            <Box>
                <Typography variant="h4" my={3}>
                    Filter by category
                </Typography>
                <List disablePadding component={Paper} sx={{ overflow: "hidden" }}>
                    {this.props.homeAppState.categories.map((category) => (
                        <ListItemButton
                            key={category.title}
                            href={RouteURL.searchResultPage({ query: { tag: category.title, sort: "recent" } })}
                        >
                            <ListItemIcon>{icons[category.title] ?? <LabelRounded />}</ListItemIcon>
                            <ListItemText
                                primary={category.title}
                                secondary={category.description}
                                primaryTypographyProps={{ variant: "h6" }}
                            />
                            <ArrowForwardRounded sx={{ height: 18, width: 18 }} />
                        </ListItemButton>
                    ))}
                </List>
            </Box>
        );
    }

    renderCallToAction() {
        return (
            <Paper
                sx={{ bgcolor: "primary.light", p: 3, display: this._context.mediaQuery.md.up ? "initial" : "none" }}
            >
                <Avatar sx={{ height: 50, width: 50, bgcolor: "primary.dark" }}>
                    <ArrowUpwardRounded sx={{ height: "70%", width: "70%" }} />
                </Avatar>
                <Typography variant="h3" my={3}>
                    Publish your APIs!
                </Typography>
                <Typography variant="body1" my={3}>
                    FastCharge is a platform for API publishers to publish their APIs and manage their customers.
                </Typography>
                <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    endIcon={<ArrowForwardRounded />}
                    href={RouteURL.documentationPage() + "/docs/intro-publish-api"}
                >
                    Get started
                </Button>
            </Paper>
        );
    }

    renderCallToAction2() {
        return (
            <Paper sx={{ bgcolor: "primary.light", p: 5, position: "relative", overflow: "hidden", height: "100%" }}>
                <Box
                    sx={{
                        borderRadius: "50%",
                        width: 500,
                        height: 500,
                        bgcolor: "primary.main",
                        opacity: 0.1,
                        position: "absolute",
                        zIndex: 0,
                        right: -200,
                        bottom: -200,
                    }}
                ></Box>
                <Box
                    sx={{
                        zIndex: 1,
                        position: "relative",
                    }}
                >
                    <Avatar sx={{ height: 50, width: 50, bgcolor: "primary.dark" }}>
                        <ArrowUpwardRounded sx={{ height: "70%", width: "70%" }} />
                    </Avatar>
                    <Typography variant="h2" my={3}>
                        Publish your APIs!
                    </Typography>
                    <Typography variant="body1" my={3}>
                        FastCharge is a platform for API publishers to publish their APIs and manage their customers.
                    </Typography>
                    <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        endIcon={<ArrowForwardRounded />}
                        href={RouteURL.documentationPage() + "/docs/intro-publish-api"}
                    >
                        Get started
                    </Button>
                </Box>
            </Paper>
        );
    }

    renderCallToAction3() {
        return (
            <Paper sx={{ bgcolor: "primary.dark", p: 5, position: "relative", overflow: "hidden", height: "100%" }}>
                <Box
                    sx={{
                        borderRadius: "50%",
                        width: 500,
                        height: 500,
                        bgcolor: "primary.light",
                        opacity: 0.1,
                        position: "absolute",
                        zIndex: 0,
                        right: -200,
                        bottom: -200,
                    }}
                ></Box>
                <Box
                    sx={{
                        zIndex: 1,
                        position: "relative",
                    }}
                >
                    <Avatar sx={{ height: 50, width: 50, bgcolor: "warning.main" }}>
                        <TipsAndUpdatesRounded sx={{ height: "70%", width: "70%" }} />
                    </Avatar>
                    <Typography variant="h2" my={3} color="primary.contrastText">
                        Documentation
                    </Typography>
                    <Typography variant="body1" my={3} color="primary.contrastText">
                        Learn how to subscribe to an app, or create an app to make income.
                    </Typography>
                    <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        endIcon={<ArrowForwardRounded />}
                        href={RouteURL.documentationPage()}
                    >
                        View tutorial
                    </Button>
                </Box>
            </Paper>
        );
    }

    renderTutorial() {
        const steps = [
            {
                title: "Create an app",
                description: "Start by creating an app that hosts your APIs.",
                link: RouteURL.documentationPage() + "/docs/cli-reference/fastcharge/app/create",
                icon: <AppDrawingBoardIcon style={{ height: 150 }} />,
                target: "_blank",
            },
            {
                title: "Set a price",
                description: "Create pricing plans for your app.",
                link: RouteURL.documentationPage() + "/docs/cli-reference/fastcharge/pricing/add",
                icon: <SetAPriceIcon style={{ height: 150 }} />,
                target: "_blank",
            },
            {
                title: "Publish API",
                description: "Make your app discoverable in search.",
                link: RouteURL.documentationPage() + "/docs/cli-reference/fastcharge/app/publish",
                icon: <PublishAPIIcon style={{ height: 150 }} />,
                target: "_blank",
            },
            {
                title: "Use API",
                description: "Learn how to use an API published here.",
                link: RouteURL.documentationPage() + "/docs/cli-reference/fastapi/subscription/add",
                icon: (
                    <Box sx={{ color: "primary.main" }}>
                        <MobileProgrammerIcon
                            style={{
                                height: 150,
                                color: "primary.main",
                            }}
                        />
                    </Box>
                ),
                target: "_blank",
            },
            {
                title: "Make income",
                description: "Learn how to collect income generated by your APIs.",
                link: RouteURL.accountPage(),
                icon: <MakeMoneyIcon style={{ height: 180 }} />,
                target: "_self",
            },
        ];
        return (
            <Container maxWidth="lg" sx={{ display: this._context.mediaQuery.md.down ? "none" : "block" }}>
                <Box
                    sx={{
                        bgcolor: "primary.light",
                        p: 10,
                        borderRadius: 20,
                    }}
                >
                    <Typography variant="h2" mb={8} textAlign="center">
                        As simple as 3 commands.
                    </Typography>
                    <Grid container spacing={5}>
                        {steps.map((step, index) => (
                            <Grid item xs={index < steps.length - 1 ? 4 : 8} key={step.title}>
                                <Card sx={{ height: "100%" }}>
                                    <CardActionArea
                                        component={Link}
                                        href={step.link}
                                        target={step.target}
                                        sx={{
                                            px: 4,
                                            py: 2,
                                            height: "inherit",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "start",
                                        }}
                                    >
                                        <CardMedia
                                            sx={{
                                                p: index < steps.length - 1 ? 5 : 3,
                                                alignSelf: "center",
                                                height: 230,
                                            }}
                                        >
                                            {step.icon}
                                        </CardMedia>
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Typography variant="h3" my={2}>
                                                {step.title}
                                            </Typography>
                                            <Typography variant="body1">{step.description}</Typography>
                                        </CardContent>
                                        <CardActions>
                                            <Button component="div" disableRipple endIcon={<ArrowForwardRounded />}>
                                                View details
                                            </Button>
                                        </CardActions>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Container>
        );
    }

    renderPricing() {
        return (
            <Container
                maxWidth="lg"
                sx={{
                    display: this._context.mediaQuery.xs.only ? "none" : "initial",
                }}
            >
                <Paper sx={{ overflow: "hidden" }}>
                    <Grid container>
                        <Grid item xs={this._context.mediaQuery.md.down ? 12 : 8} sx={{ p: 5 }}>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>
                                                <Typography variant="h3" fontWeight="bolder">
                                                    FastchargeAPI fees breakdown
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{/* Fat&nbsp;(g) */}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>
                                                <Chip color="primary" label="Per request" />
                                            </TableCell>
                                            <TableCell>
                                                <Chip color="success" label="$0.0001" size="small" />
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>
                                                <Chip color="primary" label="Commission" />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body1">
                                                    <Chip component="span" label="0.00%" size="small" color="warning" />
                                                    {"  Yes, zero!"}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>
                                                <Chip color="primary" label="Maximum monthly requests" />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body1">Unlimited</Typography>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>
                                                <Typography variant="h3" fontWeight="bolder">
                                                    Payment transfer
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body1">
                                                    Transfer fees are charged by 3rd-party money transfer servies of
                                                    your choice.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell sx={{ borderBottom: "none" }}>
                                                <Chip color="primary" label="With Stripe" />
                                            </TableCell>
                                            <TableCell sx={{ borderBottom: "none" }}>
                                                <Typography variant="body1">
                                                    <Chip component="span" label="$2.55" size="small" color="warning" />
                                                    {" + "}
                                                    <Chip
                                                        component="span"
                                                        label="3.65%"
                                                        size="small"
                                                        color="success"
                                                    />{" "}
                                                    of each payment to your bank account
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>
                        <Grid
                            item
                            xs={this._context.mediaQuery.md.down ? 12 : 4}
                            sx={{ bgcolor: "primary.light", p: 5 }}
                        >
                            <Stack direction="column">
                                <Typography variant="h2" justifyContent="center" mb={5}>
                                    Pricing for API Publishers
                                </Typography>
                            </Stack>
                            <Typography variant="body1" gutterBottom={true}>
                                We are on a mission to empower individual developers and small businesses. We strive to
                                keep the cost low to let you keep the income that's rightfully yours.
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 2 }}>
                                To learn more about pricing, please visit our{" "}
                                <Link
                                    href={RouteURL.termsPage()}
                                    color="info.main"
                                    sx={{ ":hover": { color: "info.light" } }}
                                >
                                    Terms & Services
                                </Link>
                                .
                            </Typography>
                            <Box my={5}>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    size="large"
                                    endIcon={<ArrowForwardRounded />}
                                    href={RouteURL.termsPage()}
                                >
                                    Terms & Services
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Container>
        );
    }

    renderTutorialCarousel() {
        return (
            <Container
                maxWidth="lg"
                sx={{
                    display: this._context.mediaQuery.md.down ? "none" : "initial",
                }}
            >
                <Typography variant="h2" textAlign="center" mb={5}>
                    Publish an API in 1 minute
                </Typography>
                <HomePagePublisherTutorialCarousel />
            </Container>
        );
    }
    render() {
        return (
            <SiteLayout>
                <HomePageBanner2 />
                <Stack
                    pb={10}
                    spacing={this._context.mediaQuery.md.down ? 8 : this._context.mediaQuery.lg.down ? 10 : 15}
                    alignItems="center"
                >
                    <Container maxWidth="lg" sx={{ mt: 2.5 }}>
                        <Grid
                            container
                            spacing={5}
                            direction={this._context.mediaQuery.md.up ? "row" : "column-reverse"}
                        >
                            <Grid item xs={this._context.mediaQuery.md.up ? 9 : 12}>
                                {this.renderProductLists()}
                                <Stack direction="row" spacing={5} sx={{ mt: 5 }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="large"
                                        endIcon={<ArrowForwardRounded />}
                                        href={RouteURL.searchResultPage({
                                            query: {
                                                tag: "Latest",
                                            },
                                        })}
                                    >
                                        Browse all APIs
                                    </Button>
                                    <AppSearchBar />
                                </Stack>
                            </Grid>
                            <Grid item xs={this._context.mediaQuery.md.up ? 3 : 12}>
                                <Stack spacing={5} sx={{ position: "sticky", top: 0 }}>
                                    {this.renderCategoryList()}
                                    {this.renderCallToAction()}
                                </Stack>
                            </Grid>
                        </Grid>
                    </Container>
                    <Container maxWidth="lg">
                        <Grid container spacing={5}>
                            <Grid item xs={this._context.mediaQuery.xs.only ? 12 : 6}>
                                {this.renderCallToAction2()}
                            </Grid>
                            <Grid item xs={this._context.mediaQuery.xs.only ? 12 : 6}>
                                {this.renderCallToAction3()}
                            </Grid>
                        </Grid>
                    </Container>
                    {this.renderTutorial()}
                    {this.renderPricing()}
                    {this.renderTutorialCarousel()}
                </Stack>
            </SiteLayout>
        );
    }
}

export const HomePage = connect<_Props, {}, {}, RootAppState>((rootAppState: RootAppState) => ({
    homeAppState: rootAppState.home,
}))(_Home);
