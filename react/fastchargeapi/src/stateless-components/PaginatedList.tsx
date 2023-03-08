import {
    Grid,
    List,
    Pagination,
    Typography,
} from "@mui/material";
import React from "react";
import { AppContext, ReactAppContextType } from "../AppContext";

export type PaginatedListOnPageChangeHandler = (data: { page: number }) => void;

type PaginatedListProps<T> = {
    sourceItems: T[];
    urlNamespace: string;
    itemsPerPage: number;
    onChange: PaginatedListOnPageChangeHandler;
    listItemGenerator: (items: T[]) => JSX.Element[];
};

export class PaginatedList<T> extends React.Component<PaginatedListProps<T>> {
    static contextType = ReactAppContextType;
    get _context(): AppContext {
        return this.context as AppContext;
    }

    currentPageNum(): number {
        let p = this._context.route.query.get(`${this.props.urlNamespace}page`);
        return p ? Number.parseInt(p) : 1;
    }

    currentPageSourceItems() {
        let start =
            (this.currentPageNum() - 1) * this.props.itemsPerPage;
        return this.props.sourceItems.slice(
            start,
            start + this.props.itemsPerPage
        );
    }

    totalNumOfPages() {
        return Math.ceil(
            this.props.sourceItems.length / this.props.itemsPerPage
        );
    }

    onPageChange(page: number) {
        this._context.route.updateQuery({
            [`${this.props.urlNamespace}page`]: page.toString(),
        });
    }

    render() {
        return (
            <Grid container rowGap={5}>
                <Grid item xs={12}>
                    <List sx={{ mt: 0 }}>
                        {this.props.listItemGenerator(
                            this.currentPageSourceItems()
                        )}
                    </List>
                    {this.props.sourceItems.length === 0 && (
                        <Typography variant="body1" m={2} sx={{ opacity: 0.8 }}>
                            No results found.
                        </Typography>
                    )}

                    {this.currentPageSourceItems().length > 0 && (
                        <Pagination
                            count={this.totalNumOfPages()}
                            page={this.currentPageNum()}
                            onChange={(e, page) => this.onPageChange(page)}
                            sx={{ flexGrow: 1, mt: 2 }}
                        />
                    )}
                </Grid>
            </Grid>
        );
    }
}
