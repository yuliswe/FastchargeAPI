import React from "react";
import { RootAppState } from "../states/RootAppState";
import { connect } from "react-redux";
import {
    Box,
    Button,
    Grid,
    Link,
    Menu,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { DashboardAppState } from "../states/DashboardAppState";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
type Props = {
    dashboardAppState: DashboardAppState;
};

type State = {
    moveMoneyMenuAnchorEl: HTMLElement | null;
};

class _DashboardPage extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            moveMoneyMenuAnchorEl: null,
        };
    }

    activities() {
        return [
            {
                date: new Date(),
                description: "API Usage",
                quantity: 1,
                app: "My App",
                earned: "1.00",
                spent: "",
            },
        ];
    }

    handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // setAuth(event.target.checked);
    };

    handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        this.setState({
            moveMoneyMenuAnchorEl: event.currentTarget,
        });
    };

    handleClose = () => {
        this.setState({
            moveMoneyMenuAnchorEl: null,
        });
    };

    render() {
        return (
            <Box>
                <Grid container>
                    <Grid item flexGrow={1}>
                        <Typography variant="h6">Credit</Typography>
                        <Typography
                            variant="body1"
                            fontSize={30}
                            fontWeight={400}
                        >
                            $24,8976.61
                        </Typography>
                    </Grid>
                    <Grid item>
                        <Box>
                            <Button
                                variant="contained"
                                onClick={this.handleMenu}
                                endIcon={<KeyboardArrowDownIcon />}
                            >
                                Move Money
                            </Button>
                            <Menu
                                anchorEl={this.state.moveMoneyMenuAnchorEl}
                                anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "right",
                                }}
                                PaperProps={{
                                    elevation: 1,
                                    sx: {
                                        // backgroundColor: "background.default",
                                        borderRadius: 5,
                                    },
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: "top",
                                    horizontal: "right",
                                }}
                                open={Boolean(this.state.moveMoneyMenuAnchorEl)}
                                onClose={this.handleClose}
                            >
                                <MenuItem
                                    onClick={this.handleClose}
                                    LinkComponent={Button}
                                >
                                    Add funds
                                </MenuItem>
                                <MenuItem
                                    href="/account"
                                    onClick={this.handleClose}
                                    LinkComponent={Button}
                                >
                                    Withdraw
                                </MenuItem>
                            </Menu>
                        </Box>
                    </Grid>
                </Grid>
                <Box sx={{ mt: 5 }}>
                    <Typography variant="h6" fontSize={18}>
                        Activities
                    </Typography>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>App</TableCell>
                                <TableCell>Quantity</TableCell>
                                <TableCell>Earned</TableCell>
                                <TableCell>Spent</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {this.activities().map((activity, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        {activity.date.toDateString()}
                                    </TableCell>
                                    <TableCell>
                                        {activity.description}
                                    </TableCell>
                                    <TableCell>{activity.app}</TableCell>
                                    <TableCell>{activity.quantity}</TableCell>
                                    <TableCell>
                                        {activity.earned
                                            ? "$" + activity.earned
                                            : ""}
                                    </TableCell>
                                    <TableCell>
                                        {activity.spent
                                            ? "$" + activity.spent
                                            : ""}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            </Box>
        );
    }
}

export const DashboardPage = connect<Props, {}, {}, RootAppState>(
    (rootAppState: RootAppState) => ({
        dashboardAppState: rootAppState.appDetail,
    })
)(_DashboardPage);
