import React from "react";
import { connect } from "react-redux";
import { RootAppState } from "../states/RootAppState";
import { SiteLayout } from "../SiteLayout";
import {
    Avatar,
    Container,
    FormControl,
    FormControlLabel,
    Link,
    Grid,
    List,
    Paper,
    Radio,
    RadioGroup,
    Stack,
    Typography,
} from "@mui/material";
import { SearchAppState } from "../states/SearchAppState";
import { AppContext, ReactAppContextType } from "../AppContext";

type Props = {
    searchAppState: SearchAppState;
};

class _SearchResultPage extends React.Component<Props, {}> {
    static contextType = ReactAppContextType;
    get _context(): AppContext {
        return this.context as AppContext;
    }
    render() {
        return (
            <SiteLayout>
                <Container maxWidth="xl">
                    <Grid container>
                        <Grid item xs={3} pl={5}>
                            <Typography variant="h6" my={5}>
                                {this.props.searchAppState.numResults} result
                                {this.props.searchAppState.numResults > 1 &&
                                    "s"}{" "}
                                found
                            </Typography>
                            <Typography variant="body1" my={1}>
                                Sort results
                            </Typography>
                            <FormControl>
                                <RadioGroup
                                    aria-labelledby="demo-radio-buttons-group-label"
                                    defaultValue="exact-match"
                                    name="radio-buttons-group"
                                    onChange={(e) => {
                                        this._context.route?.updateQuery({
                                            sort: e.target.value,
                                        });
                                        // this._context.route?.navigate({
                                        //     pathname: "/search",
                                        //     search: createSearchParams({
                                        //         sort: e.target.value,
                                        //     }).toString(),
                                        // });
                                    }}
                                >
                                    <FormControlLabel
                                        value="exact-match"
                                        control={<Radio />}
                                        label="Exact match"
                                    />
                                    <FormControlLabel
                                        value="github-popularity"
                                        control={<Radio />}
                                        label="Github popularity"
                                    />
                                </RadioGroup>
                            </FormControl>
                        </Grid>
                        <Grid item xs={9}>
                            <List sx={{ mt: 0 }}>
                                <Paper
                                    sx={{
                                        py: 3,
                                        borderBottom: 1,
                                        borderBottomColor: "divider",
                                        bgcolor: "transparent",
                                    }}
                                >
                                    <Link href={`/apis/appname`}>
                                        <Typography variant="h6" my={2}>
                                            API-FOOTBALL API
                                        </Typography>
                                    </Link>
                                    <Typography variant="body1" my={2}>
                                        +960 football leagues & cups. Livescore
                                        (15s), live & pre-match odds, events,
                                        line-ups, coachs, players, top scorers,
                                        standings, statistics, transfers,
                                        predictions.
                                    </Typography>
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        alignItems="center"
                                    >
                                        <Avatar src="./logo192.png" />
                                        <Typography
                                            variant="body1"
                                            fontWeight={500}
                                        >
                                            alsontang
                                        </Typography>
                                        <Typography variant="body1">
                                            published 1.0.0
                                        </Typography>
                                        <Typography variant="body1" pl={2}>
                                            3 months ago
                                        </Typography>
                                    </Stack>
                                </Paper>
                            </List>
                        </Grid>
                    </Grid>
                </Container>
            </SiteLayout>
        );
    }
}

export const SearchResultPage = connect<Props, {}, {}, RootAppState>(
    (rootAppState: RootAppState) => ({
        searchAppState: rootAppState.search,
    })
)(_SearchResultPage);
