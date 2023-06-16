import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import FilterColumns from "@mui/icons-material/ViewWeek";
import {
    Autocomplete,
    Box,
    Button,
    Checkbox,
    Divider,
    Grid,
    Menu,
    Pagination,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import React from "react";
import { AppContext, ReactAppContextType } from "../AppContext";

export type LogTableOnChangeHandler = (data: { page: number; dateRange: { end: number } }) => void;
export type LogTableProps<Activity> = {
    urlNamespace: string;
    activities: Activity[];
    tableName: string;
    activitiesPerPage: number;
    headers: LogTableHeaderCell[];
    onChange: LogTableOnChangeHandler;
    renderCell: (headerTitle: string, activity: Activity) => React.ReactNode;
};
export type LogTableState = {
    openFilterColumnsMenu: boolean;
    selectedColumns: Set<string>;
};
export type LogTableHeaderCell = {
    title: string;
    flexGrow?: boolean;
    hideByDefault?: boolean;
};
export class LogTable<Activity> extends React.Component<LogTableProps<Activity>, LogTableState> {
    static contextType = ReactAppContextType;
    get _context(): AppContext {
        return this.context as AppContext;
    }

    filterColumnsButtonEL = React.createRef<HTMLButtonElement>();

    constructor(props: LogTableProps<Activity>) {
        super(props);
        this.state = {
            openFilterColumnsMenu: false,
            selectedColumns: new Set(this.props.headers.filter((h) => !h.hideByDefault).map((h) => h.title)),
        };
    }

    activityPageNum(): number {
        const p = this._context.route.query.get(`${this.props.urlNamespace}page`);
        return p ? Number.parseInt(p) : 1;
    }

    activityRange(): number {
        const d = this._context.route.query.get(`${this.props.urlNamespace}date`);
        return d ? Number.parseInt(d) : Date.now();
    }

    handleActivityDateChange = (date: Date | null) => {
        // date is in local time, we want to set it to UTC
        date = date || new Date();
        const utc = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
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
        const start = (this.activityPageNum() - 1) * this.props.activitiesPerPage;
        return this.props.activities.slice(start, start + this.props.activitiesPerPage);
    }

    numPages() {
        return Math.ceil(this.props.activities.length / this.props.activitiesPerPage);
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
                    xs={12}
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "end",
                    }}
                >
                    <Stack direction="row" spacing={2} sx={{ my: 2, alignItems: "center" }}>
                        <Typography variant="h4" sx={{ display: "flex", alignItems: "end", flexGrow: 1 }}>
                            {this.props.tableName}
                        </Typography>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Display up to"
                                value={this.activityRange()}
                                onChange={this.handleActivityDateChange}
                                renderInput={(params) => <TextField {...params} size="small" color="info" />}
                            />
                        </LocalizationProvider>
                        <Button
                            variant="text"
                            startIcon={<FilterColumns />}
                            color="info"
                            ref={this.filterColumnsButtonEL}
                            onClick={() => {
                                this.setState({
                                    openFilterColumnsMenu: true,
                                });
                            }}
                        >
                            Columns
                        </Button>
                    </Stack>
                    <Menu
                        anchorEl={this.filterColumnsButtonEL.current}
                        open={this.state.openFilterColumnsMenu}
                        onClose={() => {
                            this.setState({
                                openFilterColumnsMenu: false,
                            });
                        }}
                        PaperProps={{
                            sx: {
                                bgcolor: "background.default",
                            },
                        }}
                    >
                        <Box sx={{ width: 300, bgcolor: "background.default", p: 1 }}>
                            <Autocomplete
                                multiple
                                options={this.props.headers.map((h) => h.title)}
                                fullWidth
                                disableCloseOnSelect
                                value={[...this.state.selectedColumns]}
                                openOnFocus={true}
                                onChange={(e, value) => {
                                    this.setState({ selectedColumns: new Set(value) });
                                }}
                                renderOption={(props, option, { selected }) => (
                                    <Box component="li" {...props}>
                                        <Checkbox
                                            icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                                            checkedIcon={<CheckBoxIcon fontSize="small" />}
                                            color="info"
                                            style={{ marginRight: 8 }}
                                            checked={selected}
                                        />
                                        <Typography variant="body2">{option}</Typography>
                                    </Box>
                                )}
                                renderInput={(params) => <TextField {...params} label="Select columns" color="info" />}
                            />
                        </Box>
                    </Menu>
                    <Divider />
                </Grid>
                <Grid item xs={12}>
                    <Box sx={{ overflowX: "scroll" }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    {this.props.headers
                                        .filter((h) => this.state.selectedColumns.has(h.title))
                                        .map((header, index) => (
                                            <TableCell
                                                key={header.title}
                                                sx={{
                                                    whiteSpace: "nowrap",
                                                    width: header.flexGrow ? "100%" : "initial",
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
                                        {this.props.headers
                                            .filter((h) => this.state.selectedColumns.has(h.title))
                                            .map((header, index) => (
                                                <TableCell
                                                    key={header.title}
                                                    sx={{
                                                        whiteSpace: "nowrap",
                                                        width: header.flexGrow ? "100%" : "initial",
                                                        // px: 4,
                                                    }}
                                                >
                                                    {this.props.renderCell(header.title, activity)}
                                                </TableCell>
                                            ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {this.props.activities.length === 0 && (
                            <Typography variant="body2" m={2} color="grey.700">
                                No activities.
                            </Typography>
                        )}
                    </Box>

                    {this.currentPageActivities().length > 0 && (
                        <Pagination
                            count={this.numPages()}
                            size={this._context.mediaQuery.xs.only ? "small" : "medium"}
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
