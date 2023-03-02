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
        date = date || new Date();
        date.setHours(0, 0, 0, 0);
        this._context.route.updateQuery({
            [`${this.props.urlNamespace}date`]: date.getTime().toString(),
        });
        this.props.onChange?.({
            page: this.activityPageNum(),
            dateRange: { end: date.getTime() },
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
            <Box>
                <Stack
                    direction="row"
                    display="flex"
                    alignItems="center"
                    mb={2}
                >
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        {this.props.tableName}
                    </Typography>
                    {/* <Pagination
        count={this.numPages()}
        page={this.activityPageNum()}
        onChange={(e, page) => this.handlePageChange(page)}
        sx={{ flexGrow: 1 }}
    /> */}
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            label="Display up to"
                            value={this.activityRange()}
                            onChange={this.handleActivityDateChange}
                            renderInput={(params) => <TextField {...params} />}
                        />
                    </LocalizationProvider>
                </Stack>
                <Table>
                    <TableHead>
                        <TableRow>
                            {this.props.headers.map((header, index) => (
                                <TableCell
                                    key={index}
                                    sx={{
                                        whiteSpace: header.flexGrow
                                            ? "100%"
                                            : "nowrap",
                                    }}
                                >
                                    {header.title}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {this.currentPageActivities().map((activity, index) => (
                            <TableRow key={index}>
                                {this.props.headers.map((header, index) => (
                                    <TableCell
                                        key={index}
                                        sx={{
                                            whiteSpace: header.flexGrow
                                                ? "100%"
                                                : "nowrap",
                                        }}
                                    >
                                        {this.props.renderCell(
                                            header.title,
                                            activity
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
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
            </Box>
        );
    }
}
