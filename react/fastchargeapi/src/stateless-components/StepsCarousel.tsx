import { ArrowBackRounded, ArrowForwardRounded } from "@mui/icons-material";
import { Box, Grid, GridProps, IconButton, Stack, StackProps } from "@mui/material";
import React from "react";

type _State = {
    currentPage: number;
    totalPages: number;
};

export type StepsCarouselProps<T> = {
    forwardButton?: React.ReactNode;
    backButton?: React.ReactNode;
    pages: T[];
    renderHeader?: (currentPage: number, totalPages: number) => React.ReactNode;
    headerGridProps?: GridProps;
    renderFooter?: (currentPage: number, totalPages: number) => React.ReactNode;
    footerGridProps?: GridProps;
    renderPage: (page: T, index: number, currentPage: number, totalPages: number) => React.ReactNode;
    iconButtonsOffsetY?: number;
    stackProps?: StackProps;
    onPageChange?: (currentPage: number, totalPages: number, pageElement: HTMLElement) => void;
    currentPage?: number;
};

export class StepsCarousel<T> extends React.Component<StepsCarouselProps<T>, _State> {
    constructor(props: StepsCarouselProps<T>) {
        super(props);
        this.state = {
            currentPage: 0,
            totalPages: props.pages.length,
        };
    }

    containerRef = React.createRef<HTMLDivElement>();

    renderForwardButton({ disabled = false }: { disabled?: boolean } = {}) {
        return (
            this.props.forwardButton ?? (
                <IconButton
                    size="large"
                    disabled={disabled}
                    sx={{
                        bgcolor: "secondary.main",
                        color: "secondary.contrastText",
                        ":hover": {
                            bgcolor: "secondary.light",
                        },
                        zIndex: 10,
                        position: this.props.iconButtonsOffsetY ? "relative" : "static",
                        top: this.props.iconButtonsOffsetY ?? 0,
                    }}
                    onClick={() => this.goForward()}
                >
                    <ArrowForwardRounded />
                </IconButton>
            )
        );
    }

    renderBackButton() {
        return (
            this.props.backButton ?? (
                <IconButton
                    size="large"
                    sx={{
                        bgcolor: "secondary.main",
                        color: "secondary.contrastText",
                        ":hover": {
                            bgcolor: "secondary.light",
                        },
                        zIndex: 10,
                        position: this.props.iconButtonsOffsetY ? "relative" : "static",
                        top: this.props.iconButtonsOffsetY ?? 0,
                    }}
                    onClick={() => this.goBackward()}
                >
                    <ArrowBackRounded />
                </IconButton>
            )
        );
    }

    getPageElement(index: number): HTMLElement | undefined {
        return this.containerRef.current?.children[2 * index] as HTMLElement | undefined;
    }

    renderChildren() {
        const children = [];
        for (const [i, p] of this.props.pages.entries()) {
            children.push(
                <Box
                    key={2 * i}
                    onClick={() => {
                        if (i !== this.state.currentPage) {
                            this.goTo(i);
                        }
                    }}
                >
                    {this.props.renderPage(p, i, this.state.currentPage, this.state.totalPages)}
                </Box>
            );
            children.push(
                <Box key={2 * i + 1} display="flex" alignItems="center">
                    {this.renderForwardButton({
                        disabled: this.state.currentPage !== i,
                    })}
                </Box>
            );
        }
        children.pop();
        return children;
    }

    goForward() {
        if (this.state.currentPage < this.state.totalPages - 1) {
            const newPage = this.state.currentPage + 1;
            this.goTo(newPage);
        }
    }

    goBackward() {
        if (this.state.currentPage > 0) {
            const newPage = this.state.currentPage - 1;
            this.goTo(newPage);
        }
    }

    goTo(newPage: number) {
        if (newPage >= 0 && newPage < this.state.totalPages) {
            this.getPageElement(newPage)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
            this.setState({ currentPage: newPage });
            this.props.onPageChange?.(newPage, this.state.totalPages, this.getPageElement(newPage)!);
        }
    }

    defaultHeaderGridSize = 2;
    defaultFooterGridSize = 2;

    defaultBodyGridProps() {
        let gridSize = 12;
        if (this.props.renderHeader) {
            gridSize -= this.defaultFooterGridSize;
        }
        if (this.props.renderFooter) {
            gridSize -= this.defaultFooterGridSize;
        }
        return { xs: gridSize };
    }

    componentDidMount(): void {
        if (this.containerRef.current?.scrollLeft) {
            this.containerRef.current.scrollLeft = 0;
        }
        this.props.onPageChange?.(0, this.state.totalPages, this.getPageElement(0)!);
    }

    componentDidUpdate(prevProps: Readonly<StepsCarouselProps<T>>, prevState: Readonly<_State>, snapshot?: any): void {
        if (this.props.currentPage != undefined && this.props.currentPage !== this.state.currentPage) {
            this.goTo(this.props.currentPage ?? 0);
        }
    }

    render() {
        return (
            <Grid container>
                {this.props.renderHeader && (
                    <Grid item xs={this.defaultHeaderGridSize} {...this.props.headerGridProps}>
                        {this.props.renderHeader?.(this.state.currentPage, this.state.totalPages)}
                    </Grid>
                )}
                <Grid item {...this.defaultBodyGridProps()}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Box sx={{ opacity: this.state.currentPage > 0 ? 1 : 0 }}>{this.renderBackButton()}</Box>
                        <Stack
                            direction="row"
                            ref={this.containerRef}
                            overflow="hidden"
                            {...this.props.stackProps}
                            position="relative"
                            sx={{ mx: 2 }}
                        >
                            {this.renderChildren()}
                        </Stack>
                    </Box>
                </Grid>
                {this.props.renderFooter && (
                    <Grid item xs={this.defaultFooterGridSize} {...this.props.footerGridProps}>
                        {this.props.renderFooter?.(this.state.currentPage, this.state.totalPages)}
                    </Grid>
                )}
            </Grid>
        );
    }
}
