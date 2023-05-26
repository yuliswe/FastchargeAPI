import {
    Avatar,
    Chip,
    Container,
    FormControl,
    FormControlLabel,
    Grid,
    Link,
    Paper,
    Radio,
    RadioGroup,
    Skeleton,
    Stack,
    Typography,
} from "@mui/material";
import React from "react";
import { connect } from "react-redux";
import { AppContext, ReactAppContextType } from "../AppContext";
import { SiteLayout } from "../SiteLayout";
import { AppSearchResultEvent, SearchResult } from "../events/AppSearchResultEvent";
import { PaginatedList, PaginatedListOnPageChangeHandler } from "../stateless-components/PaginatedList";
import { AppSearchResultState } from "../states/AppSearchResultState";
import { RootAppState } from "../states/RootAppState";
import { appStore } from "../store-config";

type Props = {
    searchResultState: AppSearchResultState;
};

class _SearchResultPage extends React.Component<Props, {}> {
    static contextType = ReactAppContextType;
    get _context(): AppContext {
        return this.context as AppContext;
    }

    componentDidMount(): void {
        appStore.dispatch(
            new AppSearchResultEvent.SearchResultEvent(this._context, this._context.route.query.get("q")!)
        );
    }

    searchResultPageChangeHandler: PaginatedListOnPageChangeHandler = ({ page }) => {
        appStore.dispatch(
            new AppSearchResultEvent.SearchResultEvent(this._context, this._context.route.query.get("q")!)
        );
    };

    searchForAppsbyKeyword = (keyword: string) => {
        this._context.route?.updateQuery({
            q: keyword,
        });
        appStore.dispatch(new AppSearchResultEvent.SearchResultEvent(this._context, keyword));
    };

    render() {
        return (
            <SiteLayout onSearch={this.searchForAppsbyKeyword}>
                <Container maxWidth="lg">
                    <Grid container spacing={5}>
                        {this._context.mediaQuery.md.up && (
                            <Grid item md={2} lg={2} xl={2} pl={5}>
                                <Typography variant="h4" my={5}>
                                    {this.props.searchResultState.searchResults.length}
                                    {this.props.searchResultState.searchResults.length > 99 && "+"} result
                                    {this.props.searchResultState.searchResults.length > 1 && "s"} found
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
                                        <FormControlLabel value="exact-match" control={<Radio />} label="Exact match" />
                                        <FormControlLabel
                                            value="github-popularity"
                                            control={<Radio />}
                                            label="Github popularity"
                                        />
                                    </RadioGroup>
                                </FormControl>
                            </Grid>
                        )}
                        <Grid item xs={12} sm={12} md={10} lg={9} xl={9}>
                            <PaginatedList<SearchResult>
                                sx={{ my: 5 }}
                                sourceItems={
                                    this.props.searchResultState.loading
                                        ? Array(7).fill(null)
                                        : this.props.searchResultState.searchResults
                                }
                                urlNamespace="s"
                                itemsPerPage={7}
                                onChange={this.searchResultPageChangeHandler}
                                renderPage={
                                    this.props.searchResultState.loading
                                        ? renderSkeleton
                                        : generateAppSearchResultComponents
                                }
                            />
                        </Grid>
                    </Grid>
                </Container>
            </SiteLayout>
        );
    }
}

const generateAppSearchResultComponents = (searchResults: SearchResult[]) => {
    return searchResults.map((result, index) => (
        <Paper key={index} sx={{ p: 3, mb: 2 }}>
            <Link href={`/app/${result.pk}`}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h5" maxWidth="20em" noWrap lineHeight="100%">
                        {result.title || result.name}
                    </Typography>
                    <Typography variant="body1" maxWidth="20em" noWrap lineHeight="100%">
                        @{result.name}
                    </Typography>
                </Stack>
            </Link>
            <Typography variant="body1" my={2} display="flex" alignItems="center">
                <Avatar
                    src="./logo192.png"
                    sx={{ display: "inline-block", mr: 1, width: 35, height: 35 }}
                    component="span"
                />
                {result.description || "The author did not provide a description for this app."}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
                <Chip label={result.owner.author || "Anonymous author"} color="primary" />
            </Stack>
        </Paper>
    ));
};

const renderSkeleton = (searchResults: SearchResult[]) => {
    return searchResults.map((_, idx) => (
        <Stack key={idx} sx={{ mb: 2, height: 150 }} spacing={2}>
            <Skeleton variant="rounded" height={100} sx={{ bgcolor: "grey.100", borderRadius: 20 }} />
            <Stack direction="row" spacing={2} alignItems="center">
                <Skeleton variant="rounded" height={30} width={"30%"} sx={{ bgcolor: "grey.100", borderRadius: 20 }} />
            </Stack>
        </Stack>
    ));
};

export const SearchResultPage = connect<Props, {}, {}, RootAppState>((rootAppState: RootAppState) => ({
    searchResultState: rootAppState.search,
}))(_SearchResultPage);
