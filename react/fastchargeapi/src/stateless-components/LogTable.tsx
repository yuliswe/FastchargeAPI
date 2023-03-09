import {
    Box,
    Stack,
    Typography,
    TextField,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Pagination,
    Divider,
    Grid,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import React from "react";
import { ReactAppContextType, AppContext } from "../AppContext";
export type LogTableOnChangeHandler = (data: {
    page: number;
    dateRange: { end: number };
}) => void;
export type LogTableProps<Activity> = {
    urlNamespace: string;
    activities: Activity[];
    tableName: string;
    activitiesPerPage: number;
    headers: LogTableHeaderCell[];
    onChange: LogTableOnChangeHandler;
    renderCell: (headerTitle: string, activity: Activity) => React.ReactNode;
};
export type LogTableState = {};
export type LogTableHeaderCell = {
    title: string;
    flexGrow?: boolean;
};
export class LogTable<Activity> extends React.Component<
    LogTableProps<Activity>,
    LogTableState
> {
    static contextType = ReactAppContextType;
    get _context(): AppContext {
        return this.context as AppContext;
    }

    constructor(props: LogTableProps<Activity>) {
        super(props);
        this.state = {};
    }

    activityPageNum(): number {
        let p = this._context.route.query.get(`${this.props.urlNamespace}page`);
        return p ? Number.parseInt(p) : 1;
    }

    activityRange(): number {
        let d = this._context.route.query.get(`${this.props.urlNamespace}date`);
        return d ? Number.parseInt(d) : Date.now();
    }

    handleActivityDateChange = (date: Date | null) => {
        // date is in local time, we want to set it to UTC
        date = date || new Date();
        let utc = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
        utc.setHours(23, 59, 59, 999);
        this._context.route.updateQuery({
            [`${this.props.urlNamespace}date`]: date.getTime().toString(),
        });
        this.props.onChange?.({
            page: this.activityPageNum(),
            dateRange: { end: utc.getTime() },
        });
    };

    currentPageActivities() {
        let start = (this.activityPageNum() - 1) * this.props.activitiesPerPage;
        return this.props.activities.slice(
            start,
            start + this.props.activitiesPerPage
        );
    }

    numPages() {
        return Math.ceil(
            this.props.activities.length / this.props.activitiesPerPage
        );
    }

    handlePageChange(page: number) {
        this._context.route.updateQuery({
            [`${this.props.urlNamespace}page`]: page.toString(),
        });
    }

    render() {
        return (
            <Grid container rowGap={5}>
                <Grid
                    item
                    xs={8}
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "end",
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{ display: "flex", alignItems: "end" }}
                    >
                        {this.props.tableName}
                    </Typography>
                    <Divider />
                </Grid>
                <Grid
                    item
                    xs={4}
                    sx={{
                        display: "flex",
                        justifyContent: "end",
                        alignItems: "start",
                        mb: 1,
                    }}
                >
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            label="Display up to"
                            value={this.activityRange()}
                            onChange={this.handleActivityDateChange}
                            renderInput={(params) => <TextField {...params} />}
                        />
                    </LocalizationProvider>
                </Grid>
                <Grid item xs={12}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                {this.props.headers.map((header, index) => (
                                    <TableCell
                                        key={index}
                                        sx={{
                                            whiteSpace: "nowrap",
                                            width: header.flexGrow
                                                ? "100%"
                                                : "initial",
                                            // px: 4,
                                        }}
                                    >
                                        {header.title}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {this.currentPageActivities().map(
                                (activity, index) => (
                                    <TableRow key={index}>
                                        {this.props.headers.map(
                                            (header, index) => (
                                                <TableCell
                                                    key={index}
                                                    sx={{
                                                        whiteSpace: "nowrap",
                                                        width: header.flexGrow
                                                            ? "100%"
                                                            : "initial",
                                                        // px: 4,
                                                    }}
                                                >
                                                    {this.props.renderCell(
                                                        header.title,
                                                        activity
                                                    )}
                                                </TableCell>
                                            )
                                        )}
                                    </TableRow>
                                )
                            )}
                        </TableBody>
                    </Table>
                    {this.props.activities.length === 0 && (
                        <Typography variant="body1" m={2} sx={{ opacity: 0.8 }}>
                            No Content
                        </Typography>
                    )}

                    {this.currentPageActivities().length > 0 && (
                        <Pagination
                            count={this.numPages()}
                            page={this.activityPageNum()}
                            onChange={(e, page) => this.handlePageChange(page)}
                            sx={{ flexGrow: 1, mt: 2 }}
                        />
                    )}
                </Grid>
            </Grid>
        );
    }
}
