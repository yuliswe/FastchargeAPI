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
// import { } from "react-router-dom";
export class AppBar extends React.PureComponent {
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
                                <Typography variant="body1" sx={{}}>
                                    Pricing
                                </Typography>
                                <Typography variant="body1" sx={{}}>
                                    Documentation
                                </Typography>
                            </Stack>
                        </Toolbar>
                    </Container>
                </MUIAppBar>
                <MUIAppBar
                    position="static"
                    sx={{ bgcolor: "background.paper" }}
                >
                    <Container maxWidth="xl">
                        <Toolbar>
                            <Link href="/">
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                >
                                    <Icon component="img" src="./logo2.png" />
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
                                    <InputBase placeholder="Search" fullWidth />
                                </Paper>
                                <Paper
                                    sx={{
                                        bgcolor: "black",
                                        display: "flex",
                                        borderBottomLeftRadius: 0,
                                        borderTopLeftRadius: 0,
                                    }}
                                >
                                    <ButtonBase sx={{ color: "white", mx: 2 }}>
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
                                    <ButtonBase sx={{ color: "black", mx: 3 }}>
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
