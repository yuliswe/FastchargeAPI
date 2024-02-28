import { Box, Grid, Pagination, SxProps, Typography } from "@mui/material";
import React, { ReactNode } from "react";
import { AppContext, ReactAppContextType } from "src/AppContext";

export type PaginatedListOnPageChangeHandler = (data: { page: number }) => void;

type PaginatedListProps<T> = {
  sourceItems: T[];
  urlNamespace: string;
  itemsPerPage: number;
  onChange: PaginatedListOnPageChangeHandler;
  renderPage: (items: T[]) => ReactNode;
  sx?: SxProps;
};

export class PaginatedList<T> extends React.PureComponent<PaginatedListProps<T>> {
  static contextType = ReactAppContextType;
  get _context(): AppContext {
    return this.context as AppContext;
  }

  currentPageNum(): number {
    const p = this._context.route.query.get(`${this.props.urlNamespace}page`);
    return Math.min(p ? Number.parseInt(p) : 1, this.totalNumOfPages());
  }

  currentPageSourceItems() {
    const start = (this.currentPageNum() - 1) * this.props.itemsPerPage;
    return this.props.sourceItems.slice(start, start + this.props.itemsPerPage);
  }

  totalNumOfPages() {
    return Math.ceil(this.props.sourceItems.length / this.props.itemsPerPage);
  }

  onPageChange(page: number) {
    this._context.route.updateQuery({
      [`${this.props.urlNamespace}page`]: page.toString(),
    });
  }

  render() {
    return (
      <Grid container rowGap={5} sx={this.props.sx}>
        <Grid item xs={12}>
          <Box sx={{ mt: 0 }}>{this.props.renderPage(this.currentPageSourceItems())}</Box>
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
