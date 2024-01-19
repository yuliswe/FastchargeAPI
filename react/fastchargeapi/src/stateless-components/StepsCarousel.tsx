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

export class StepsCarousel<T> extends React.PureComponent<StepsCarouselProps<T>, _State> {
  constructor(props: StepsCarouselProps<T>) {
    super(props);
    this.state = {
      currentPage: 0,
      totalPages: props.pages.length,
    };
  }

  containerRef = React.createRef<HTMLDivElement>();

  renderForwardButton(args: { hightlighted?: boolean; onClick: () => void }) {
    const { hightlighted, onClick } = args;
    return (
      this.props.forwardButton ?? (
        <IconButton
          size="large"
          // disabled={disabled ?? false}
          sx={{
            bgcolor: hightlighted ? "secondary.main" : "transparent",
            color: hightlighted ? "secondary.contrastText" : "secondary.light",
            ":hover": {
              bgcolor: hightlighted ? "secondary.light" : "grey.200",
            },
            zIndex: 10,
            position: this.props.iconButtonsOffsetY ? "relative" : "static",
            top: this.props.iconButtonsOffsetY ?? 0,
          }}
          onClick={onClick}
        >
          <ArrowForwardRounded />
        </IconButton>
      )
    );
  }

  renderBackButton(props: { onClick: () => void }) {
    const { onClick } = props;
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
          onClick={onClick}
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
            this.goTo(i);
          }}
        >
          {this.props.renderPage(p, i, this.state.currentPage, this.state.totalPages)}
        </Box>
      );
      children.push(
        <Box key={2 * i + 1} display="flex" alignItems="center">
          {this.renderForwardButton({
            onClick: () => this.goTo(i + 1),
            hightlighted: this.state.currentPage === i,
          })}
        </Box>
      );
    }
    children.pop();
    return children;
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
            <Box sx={{ opacity: this.state.currentPage > 0 ? 1 : 0 }}>
              {this.renderBackButton({
                onClick: () => this.goTo(this.state.currentPage - 1),
              })}
            </Box>
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
