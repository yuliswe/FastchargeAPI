import React from "react";
import { RootAppState } from "../states/RootAppState";
import { AppDetailAppState } from "../states/AppDetailAppState";
import { connect } from "react-redux";
import {
    Avatar,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Container,
    Grid,
    Link,
    List,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import { SiteLayout } from "../SiteLayout";

type Props = {
    appDetailAppState: AppDetailAppState;
};
class _AppDetailPage extends React.Component {
    render() {
        return (
            <SiteLayout>
                <Container maxWidth="xl">
                    <Grid container>
                        <Grid item px={5} xs={9}>
                            <Stack spacing={5}>
                                <Box>
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        mt={5}
                                        mb={1}
                                        alignItems="center"
                                    >
                                        <Typography variant="h6">
                                            My App
                                        </Typography>
                                        <Typography variant="body1">
                                            1.3.7
                                        </Typography>
                                        <Typography variant="body1">
                                            Published 10 months ago
                                        </Typography>
                                    </Stack>
                                    <Typography variant="body1">
                                        App description
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="h6" mb={1}>
                                        Pricing
                                    </Typography>
                                    <Grid container>
                                        <Grid item xs={3}>
                                            <Card
                                                variant="outlined"
                                                elevation={100}
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 5,
                                                    // bgcolor: "",
                                                    border: "none",
                                                    // backgroundImage:
                                                    //     "linear-gradient(to right, #ffecd2 0%, #fcb69f 100%)",
                                                }}
                                            >
                                                <CardContent>
                                                    <Typography
                                                        variant="body1"
                                                        mb={2}
                                                    >
                                                        Basic Plan
                                                    </Typography>
                                                    <Typography>
                                                        <b>Per request:</b>{" "}
                                                        $0.01
                                                    </Typography>
                                                    <Typography>
                                                        <b>
                                                            First request in 30
                                                            days:
                                                        </b>{" "}
                                                        $0.01
                                                    </Typography>
                                                    <Typography>
                                                        <b>Free quota:</b> first
                                                        1000 requests
                                                    </Typography>
                                                </CardContent>
                                                <CardActions>
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                    >
                                                        Subscribe
                                                    </Button>
                                                </CardActions>
                                            </Card>
                                        </Grid>
                                    </Grid>
                                </Box>
                                <Box>
                                    <Typography variant="h6" mb={1}>
                                        Endpoints
                                    </Typography>
                                    <Stack spacing={2}>
                                        <Box>
                                            <Stack direction="row" spacing={1}>
                                                <Typography
                                                    variant="body1"
                                                    color="secondary.main"
                                                    fontWeight={700}
                                                >
                                                    GET
                                                </Typography>
                                                <code>/google</code>
                                            </Stack>
                                            <Typography variant="body1">
                                                Description
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            </Stack>
                        </Grid>
                        <Grid item xs={3} my={5}>
                            <Typography
                                variant="h6"
                                fontWeight={700}
                                fontSize={15}
                            >
                                Repository
                            </Typography>
                            <Typography variant="body1" component={Link}>
                                https://github.com/someuser/myapp
                            </Typography>
                            <Typography
                                variant="h6"
                                fontWeight={700}
                                fontSize={15}
                                mt={2}
                                pt={2}
                                sx={{
                                    borderTop: 1,
                                    borderTopColor: "divider",
                                }}
                            >
                                Homepage
                            </Typography>
                            <Typography variant="body1" component={Link}>
                                https://github.com/someuser/myapp
                            </Typography>
                            <Typography
                                variant="h6"
                                fontWeight={700}
                                fontSize={15}
                                mt={2}
                                py={2}
                                sx={{
                                    borderTop: 1,
                                    borderTopColor: "divider",
                                }}
                            >
                                Author
                            </Typography>
                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                            >
                                <Avatar src="./logo192.png" />
                                <Typography variant="body1" component={Link}>
                                    Aome person
                                </Typography>
                            </Stack>
                        </Grid>
                    </Grid>
                </Container>
            </SiteLayout>
        );
    }
}

export const AppDetailPage = connect<Props, {}, {}, RootAppState>(
    (rootAppState: RootAppState) => ({
        appDetailAppState: rootAppState.appDetail,
    })
)(_AppDetailPage);
