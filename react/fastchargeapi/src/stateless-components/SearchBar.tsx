import SearchIcon from "@mui/icons-material/Search";
import { Button, IconButton, InputBase, Paper, Stack, Typography } from "@mui/material";
import React from "react";
import { AppContext, ReactAppContextType } from "../AppContext";

type _State = {
    searchText: string;
};

type _Props = {
    onSearch?: (query: string) => void;
    searchText: string;
    showSearchButton?: boolean;
};

export class SearchBar extends React.Component<_Props, _State> {
    static contextType = ReactAppContextType;
    get _context(): AppContext {
        return this.context as AppContext;
    }

    constructor(props: _Props) {
        super(props);
        this.state = {
            searchText: this.props.searchText,
        };
    }

    componentDidUpdate(prevProps: Readonly<_Props>, prevState: Readonly<_State>, snapshot?: any): void {
        if (prevProps.searchText !== this.props.searchText) {
            this.setState({
                searchText: this.props.searchText,
            });
        }
    }

    inputRef = React.createRef<HTMLInputElement>();

    borderRadius() {
        const themeBR =
            (this._context.theme.components?.MuiButton?.styleOverrides?.root as any)["borderRadius"] ??
            this._context.theme.shape.borderRadius;
        return themeBR * 0.5;
    }

    render() {
        return (
            <Stack direction="row" display="flex" flexGrow={1} height={50}>
                <Paper
                    sx={{
                        pl: 1,
                        py: 0.25,
                        borderBottomRightRadius: this.props.showSearchButton ? 0 : this.borderRadius(),
                        borderTopRightRadius: this.props.showSearchButton ? 0 : this.borderRadius(),
                        borderBottomLeftRadius: this.borderRadius(),
                        borderTopLeftRadius: this.borderRadius(),
                        display: "flex",
                        flexGrow: 1,
                        bgcolor: "background.default",
                    }}
                >
                    <IconButton
                        type="button"
                        aria-label="search"
                        onClick={() => {
                            this.inputRef.current?.focus();
                        }}
                    >
                        <SearchIcon />
                    </IconButton>
                    <InputBase
                        placeholder="Search app"
                        fullWidth
                        value={this.state.searchText}
                        inputRef={this.inputRef}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                this.props.onSearch?.(this.state.searchText);
                            }
                        }}
                        onChange={(event) => {
                            this.setState({
                                searchText: event.target.value,
                            });
                        }}
                    />
                </Paper>
                <Button
                    sx={{
                        display: this.props.showSearchButton ? "flex" : "none",
                        borderBottomLeftRadius: 0,
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: this.borderRadius(),
                        borderBottomRightRadius: this.borderRadius(),
                        ":hover": {
                            color: "black.contrastText",
                        },
                    }}
                    variant="contained"
                    color="secondary"
                    onClick={() => {
                        this.props.onSearch?.(this.state.searchText);
                    }}
                >
                    <Typography>Search</Typography>
                </Button>
            </Stack>
        );
    }
}
