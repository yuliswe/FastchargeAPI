import React from "react";
import {
    Box,
    Button,
    ButtonBase,
    Container,
    Icon,
    IconButton,
    InputBase,
    AppBar as MUIAppBar,
    Paper,
    Stack,
    TextField,
    Toolbar,
    Link,
    Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { AppContext, ReactAppContextType } from "../AppContext";
import { createSearchParams } from "react-router-dom";
// import { } from "react-router-dom";

type State = {
    searchText: string;
};

export class AppBar extends React.Component<{}, State> {
    static contextType = ReactAppContextType;
    get _context(): AppContext {
        return this.context as AppContext;
    }

    constructor(props: any) {
        super(props);
        this.state = {
            searchText: "",
        };
    }

    componentDidMount(): void {
        this.setState({
            searchText: this._context.route?.query.get("q") || "",
        });
    }
    render() {
        return (
            <Stack>
                <MUIAppBar position="static" sx={{ bgcolor: "primary.main" }}>
                    <Container maxWidth="xl">
                        <Toolbar>
                            <Typography
                                variant="body1"
                                sx={{
                                    flexGrow: 1,
                                }}
                            >
                                Enpowering developers
                            </Typography>
                            <Stack direction="row" spacing={5} mx={5}>
                                <Link href="/#tag-pricing">
                                    <Typography
                                        variant="body1"
                                        color="primary.contrastText"
                                    >
                                        Pricing
                                    </Typography>
                                </Link>
                                <Typography variant="body1" sx={{}}>
                                    Documentation
                                </Typography>
                            </Stack>
                        </Toolbar>
                    </Container>
                </MUIAppBar>
                <MUIAppBar
                    position="static"
                    sx={{ bgcolor: "background.default" }}
                >
                    <Container maxWidth="xl">
                        <Toolbar>
                            <Link href="/">
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                >
                                    <Icon component="img" src="/logo2.png" />
                                    <Typography
                                        variant="h6"
                                        component="div"
                                        color="black"
                                        fontFamily="Ubuntu"
                                        fontWeight="normal"
                                        fontSize={18}
                                    >
                                        FastchargeAPI
                                    </Typography>
                                </Stack>
                            </Link>
                            <Stack
                                direction="row"
                                display="flex"
                                my={1}
                                mx={5}
                                flexGrow={1}
                                height={50}
                            >
                                <Paper
                                    sx={{
                                        pl: 1,
                                        py: 0.25,
                                        borderBottomRightRadius: 0,
                                        borderTopRightRadius: 0,
                                        display: "flex",
                                        bgcolor: "grey.300",
                                        flexGrow: 1,
                                    }}
                                >
                                    <IconButton
                                        type="button"
                                        aria-label="search"
                                    >
                                        <SearchIcon />
                                    </IconButton>
                                    <InputBase
                                        placeholder="Search"
                                        fullWidth
                                        value={this.state.searchText}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter") {
                                                this._context.route?.navigate({
                                                    pathname: "/search",
                                                    search: createSearchParams({
                                                        q: this.state
                                                            .searchText,
                                                    }).toString(),
                                                });
                                            }
                                        }}
                                        onChange={(event) => {
                                            this.setState({
                                                searchText: event.target.value,
                                            });
                                        }}
                                    />
                                </Paper>
                                <Paper
                                    sx={{
                                        bgcolor: "black",
                                        display: "flex",
                                        borderBottomLeftRadius: 0,
                                        borderTopLeftRadius: 0,
                                    }}
                                >
                                    <ButtonBase
                                        component={Link}
                                        sx={{ color: "white", px: 2 }}
                                        href={`/search?q=${this.state.searchText}`}
                                    >
                                        <Typography>Search</Typography>
                                    </ButtonBase>
                                </Paper>
                                <Paper
                                    sx={{
                                        bgcolor: "white",
                                        display: "flex",
                                        ml: 3,
                                    }}
                                >
                                    <ButtonBase sx={{ color: "black", px: 3 }}>
                                        <Typography>Sign In</Typography>
                                    </ButtonBase>
                                </Paper>
                            </Stack>
                        </Toolbar>
                    </Container>
                </MUIAppBar>
            </Stack>
        );
    }
}
