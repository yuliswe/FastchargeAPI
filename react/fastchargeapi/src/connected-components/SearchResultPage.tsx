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
    Paper,
    Radio,
    RadioGroup,
    Stack,
    Typography,
} from "@mui/material";
import { AppSearchResultState } from "../states/AppSearchResultState";
import { AppContext, ReactAppContextType } from "../AppContext";
import { appStore } from "../store-config";
import { AppSearchResultEvent, SearchResult } from "../events/AppSearchResultEvent";
import { PaginatedList, PaginatedListOnPageChangeHandler } from "../stateless-components/PaginatedList";

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
        appStore.dispatch(new AppSearchResultEvent.SearchResultEvent(this._context, keyword));
    };

    render() {
        return (
            <SiteLayout onSearch={this.searchForAppsbyKeyword}>
                <Container maxWidth="xl">
                    <Grid container>
                        <Grid item xs={3} pl={5}>
                            <Typography variant="h6" my={5}>
                                {this.props.searchResultState.searchResults.length} result
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
                        <Grid item xs={9}>
                            <PaginatedList<SearchResult>
                                sourceItems={this.props.searchResultState.searchResults}
                                urlNamespace="s"
                                itemsPerPage={7}
                                onChange={this.searchResultPageChangeHandler}
                                listItemGenerator={generateAppSearchResultComponents}
                            />
                            {/* <List sx={{ mt: 0 }}>
                                {createListItems(this.props.searchResultState.searchResults)}
                            </List> */}
                        </Grid>
                    </Grid>
                </Container>
            </SiteLayout>
        );
    }
}

const generateAppSearchResultComponents = (searchResults: SearchResult[]): JSX.Element[] => {
    return searchResults.map((result, index) => (
        <Paper
            key={index}
            sx={{
                py: 3,
                borderBottom: 1,
                borderBottomColor: "divider",
                bgcolor: "transparent",
            }}
        >
            <Link href={`/app/${result.pk}`} underline="hover">
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h6">{result.title || "Untitled App"}</Typography>
                    <Typography variant="body1" color="secondary.main">
                        @{result.name}
                    </Typography>
                </Stack>
            </Link>
            <Typography variant="body1" my={2}>
                {result.description || "The author did not provide a description for this app."}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
                <Avatar src="./logo192.png" />
                <Typography variant="body1" fontWeight={500}>
                    {result.owner.author || "Anonymous author"}
                </Typography>
            </Stack>
        </Paper>
    ));
};

export const SearchResultPage = connect<Props, {}, {}, RootAppState>((rootAppState: RootAppState) => ({
    searchResultState: rootAppState.search,
}))(_SearchResultPage);
