import React from "react";
import { connect } from "react-redux";
import { HomeAppState } from "../states/HomeAppState";
import { RootAppState } from "../states/RootAppState";
import { SiteLayout } from "../SiteLayout";
import {
    Box,
    Button,
    Container,
    Grid,
    Link,
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
import Terminal, { ColorMode, TerminalInput, TerminalOutput } from "react-terminal-ui";
import { AppContext, ReactAppContextType } from "../AppContext";

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
    render() {
        return (
            <SiteLayout>
                <Box
                    py={15}
                    sx={{
                        backgroundImage: "linear-gradient(to right, #ffecd2 0%, #fcb69f 100%)",
                    }}
                >
                    <Container maxWidth="xl">
                        <Grid container rowSpacing={10} columnSpacing={this._context.mediaQuery.md ? 5 : 10}>
                            <Grid item xs={6}>
                                <Stack spacing={5} p={5}>
                                    <Typography variant="h1">Sell your API with 3 simple commands</Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            fontSize: 18,
                                        }}
                                    >
                                        FastchargeAPI is an API gateway between your API and your customers, taking care
                                        of metering and billing the customers, so that you can focus on solving more
                                        important problems.
                                    </Typography>
                                    <Box>
                                        <Button
                                            href="/auth?redirect=/account"
                                            variant="contained"
                                            sx={{
                                                fontSize: 18,
                                                px: 3,
                                                py: 1,
                                                fontWeight: 500,
                                                borderRadius: 50,
                                            }}
                                        >
                                            Create API
                                        </Button>
                                    </Box>
                                </Stack>
                            </Grid>
                            <Grid item xs={6}>
                                <Paper
                                    className="terminal"
                                    elevation={20}
                                    sx={{
                                        borderRadius: 5,
                                    }}
                                >
                                    <Terminal colorMode={ColorMode.Dark} height="400px">
                                        <TerminalInput>fastcharge login</TerminalInput>
                                        <TerminalOutput>Login success.</TerminalOutput>
                                        <TerminalInput>fastcharge app create "myapp"</TerminalInput>
                                        <TerminalOutput>Created app "myapp".</TerminalOutput>
                                        <TerminalInput>
                                            {`fastcharge api add --app "myapp" --path "/google" \\ \n    --destination "https://google.com"`}
                                        </TerminalInput>
                                        <TerminalOutput>
                                            {`Created endpoint: \n  App:   myapp\n  Path:  /google \n  https://myapp.fastchargeapi.com/google ~> https://google.com`}
                                        </TerminalOutput>
                                        <TerminalInput>{`curl "https://myapp.fastchargeapi.com/google"`}</TerminalInput>
                                    </Terminal>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Container>
                </Box>
                <Box py={15}>
                    <Container maxWidth="lg">
                        <Grid container columnSpacing={this._context.mediaQuery.md ? 5 : 10}>
                            <Grid item xs={6}>
                                <Typography variant="h2">API Publisher</Typography>
                                <Stack mt={12} spacing={1}>
                                    <Typography variant="body1">
                                        <b>--name:</b> Specify the name for the pricing plan.
                                    </Typography>
                                    <Typography variant="body1">
                                        <b>--app:</b> Specify app to which the pricing plan belongs.
                                    </Typography>
                                    <Typography variant="body1">
                                        <b>--charge-per-request:</b> How much the customer pays per request.
                                    </Typography>
                                    <Typography variant="body1">
                                        <b>--monthly-charge:</b> How much the customer pays for the first request in 30
                                        days.
                                    </Typography>
                                    <Typography variant="body1">
                                        <b>--free-quota:</b> How many requests can a new customer use without paying.
                                    </Typography>
                                </Stack>
                            </Grid>
                            <Grid item xs={6}>
                                <Stack spacing={5}>
                                    <Stack spacing={3}>
                                        <Typography variant="h3">Set a price</Typography>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                fontSize: 18,
                                            }}
                                        >
                                            Create a pricing plan your customers can subscribe to.
                                        </Typography>
                                        <Paper
                                            className="terminal"
                                            elevation={20}
                                            sx={{
                                                borderRadius: 5,
                                            }}
                                        >
                                            <Terminal colorMode={ColorMode.Dark} height="200px">
                                                <TerminalInput>
                                                    {`fastcharge pricing add \\ \n    --name "Basic Plan" \\ \n    --app "myapp" \\ \n    --charge-per-request 0.0001 \\ \n    --monthly-charge 1 \\ \n    --free-quota 1000`}
                                                </TerminalInput>
                                                <TerminalOutput>Pricing plan created.</TerminalOutput>
                                            </Terminal>
                                        </Paper>
                                    </Stack>
                                    <Stack spacing={3}>
                                        <Typography
                                            variant="h3"
                                            sx={{
                                                mt: 5,
                                            }}
                                        >
                                            Connect your Stripe Account
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                fontSize: 18,
                                            }}
                                        >
                                            Create a Stripe account with FastchargeAPI to get paid.
                                        </Typography>
                                        <Paper
                                            className="terminal"
                                            elevation={20}
                                            sx={{
                                                borderRadius: 5,
                                            }}
                                        >
                                            <Terminal colorMode={ColorMode.Dark} height="50px">
                                                <TerminalInput>{`fastcharge stripe connect`}</TerminalInput>
                                                <TerminalOutput>
                                                    Complete the registration process in browser.
                                                </TerminalOutput>
                                            </Terminal>
                                        </Paper>
                                    </Stack>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Container>
                </Box>
                <Box bgcolor="background.paper" py={15} id="tag-pricing">
                    <Container maxWidth="lg">
                        <Grid container spacing={5}>
                            <Grid item xs={6}>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>
                                                    <Typography variant="h6" fontWeight="bolder">
                                                        FastchargeAPI fees
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{/* Fat&nbsp;(g) */}</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>
                                                    <Typography variant="body1" fontWeight={700}>
                                                        Service fee
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body1">
                                                        $0.0001 per request by your customer
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>
                                                    <Typography variant="body1" fontWeight={700}>
                                                        Commission fee
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body1">0% of your income</Typography>
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>
                                                    <Typography variant="body1" fontWeight={700}>
                                                        Maximum monthly requests
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body1">Unlimited</Typography>
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>
                                                    <Typography variant="h6" fontWeight="bolder" sx={{ mt: 5 }}>
                                                        Payment transfer fees
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{/* Fat&nbsp;(g) */}</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>
                                                    <Typography variant="body1" fontWeight={700}>
                                                        With Stripe
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body1">
                                                        $2.55 + 3.65% of each payment to your bank account
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                            <Grid item xs={6}>
                                <Stack direction="column">
                                    <Typography variant="h2" justifyContent="center" mb={5}>
                                        Pricing for API Publisher
                                    </Typography>
                                </Stack>
                                <Typography variant="body1" gutterBottom={true}>
                                    We are on a mission to empower individual developers and small teams to build and
                                    sell their APIs. We strive to keep the cost low, charging only a flat fee based on
                                    the number of requests, so that you can keep the income that's rightfully yours.
                                </Typography>
                                <Typography variant="body1" sx={{ mt: 2 }}>
                                    To learn more about pricing, please visit our{" "}
                                    <Link href="/terms-of-service#pricing" underline="hover" color="info.main">
                                        Terms & Services
                                    </Link>
                                    .
                                </Typography>
                            </Grid>
                        </Grid>
                    </Container>
                </Box>
                <Box py={15}>
                    <Container maxWidth="lg">
                        <Grid container columnSpacing={this._context.mediaQuery.md ? 5 : 10}>
                            <Grid item xs={6}>
                                <Typography variant="h2">API Customer</Typography>
                                <Stack mt={12} spacing={1}>
                                    <Typography variant="body1">
                                        <b>--app:</b> Name of the app you want to subscribe to.
                                    </Typography>
                                    <Typography variant="body1">
                                        <b>--pricing:</b> Name of the pricing plan you want to subscribe to.
                                    </Typography>
                                </Stack>
                            </Grid>
                            <Grid item xs={6}>
                                <Stack spacing={5}>
                                    <Stack spacing={3}>
                                        <Typography variant="h3">Subscribe to an App</Typography>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                fontSize: 18,
                                            }}
                                        >
                                            Subscribe to an App's pricing plan to start using the API.
                                        </Typography>
                                        <Paper
                                            className="terminal"
                                            elevation={20}
                                            sx={{
                                                borderRadius: 5,
                                            }}
                                        >
                                            <Terminal colorMode={ColorMode.Dark} height="150px">
                                                <TerminalInput>
                                                    {`fastapi subscription sub \\ \n    --app "myapp" \\ \n    --pricing "Basic Plan"`}
                                                </TerminalInput>
                                                <TerminalOutput>
                                                    Subscribed to app "myapp" with "Basic plan" pricing.
                                                </TerminalOutput>
                                            </Terminal>
                                        </Paper>
                                    </Stack>
                                    <Stack spacing={3}>
                                        <Typography
                                            variant="h3"
                                            sx={{
                                                mt: 5,
                                            }}
                                        >
                                            Create an API Token
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                fontSize: 18,
                                            }}
                                        >
                                            Create an API token to use the API.
                                        </Typography>
                                        <Paper
                                            className="terminal"
                                            elevation={20}
                                            sx={{
                                                borderRadius: 5,
                                            }}
                                        >
                                            <Terminal colorMode={ColorMode.Dark} height="50px">
                                                <TerminalInput>{`fastapi token create --app "myapp"`}</TerminalInput>
                                                <TerminalOutput>Token: xxxxxxxxxxxxxxxxxxxx</TerminalOutput>
                                            </Terminal>
                                        </Paper>
                                    </Stack>
                                    <Stack spacing={3}>
                                        <Typography
                                            variant="h3"
                                            sx={{
                                                mt: 5,
                                            }}
                                        >
                                            Call the API
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                fontSize: 18,
                                            }}
                                        >
                                            Include this token in the <code>X-FAST-API-KEY</code> header of your API
                                            requests.
                                        </Typography>
                                        <Paper
                                            className="terminal"
                                            elevation={20}
                                            sx={{
                                                borderRadius: 5,
                                            }}
                                        >
                                            <Terminal colorMode={ColorMode.Dark} height="50px">
                                                <TerminalInput>
                                                    {`curl "https://myapp.fastchargeapi.com/google" \n    -H "X-FAST-API-KEY: xxxxxxxxxxxxxxxxxxxx"`}
                                                </TerminalInput>
                                            </Terminal>
                                        </Paper>
                                    </Stack>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Container>
                </Box>
            </SiteLayout>
        );
    }
}

export const HomePage = connect<_Props, {}, {}, RootAppState>((rootAppState: RootAppState) => ({
    homeAppState: rootAppState.home,
}))(_Home);
