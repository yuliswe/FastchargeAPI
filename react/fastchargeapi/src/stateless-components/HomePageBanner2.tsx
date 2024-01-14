import { Box, Container, Stack, Typography } from "@mui/material";
import React from "react";
import { AppContext, ReactAppContextType } from "../AppContext";
import { ReactComponent as BannerIconAddFiles } from "../svg/banner-icon-add-files.svg";
import { ReactComponent as BannerIconCoding } from "../svg/banner-icon-coding.svg";
import { ReactComponent as BannerIconLaptop } from "../svg/banner-icon-laptop.svg";
import { ReactComponent as BannerIconScribbleArrow } from "../svg/banner-icon-scribble-arrow.svg";
import { ReactComponent as BannerIconScribbleArrow2 } from "../svg/banner-icon-scribble-arrow2.svg";
import { ReactComponent as BannerIconScribbleCircle } from "../svg/banner-icon-scribble-circle.svg";
import { ReactComponent as BannerIconScribbleCloud } from "../svg/banner-icon-scribble-cloud.svg";
import { ReactComponent as BannerIconScribbleDoubleCircle } from "../svg/banner-icon-scribble-double-circle.svg";
import { ReactComponent as BannerIconScribbleShape } from "../svg/banner-icon-scribble-shape.svg";
import { ReactComponent as BannerIconServer } from "../svg/banner-icon-server.svg";
import { AppSearchBar } from "./AppSearchBar";
export class HomePageBanner2 extends React.PureComponent {
  static contextType = ReactAppContextType;
  get _context() {
    return this.context as AppContext;
  }
  render() {
    return (
      <Box // background
        sx={{
          bgcolor: "primary.light",
          position: "relative",
          overflow: "hidden",
          p: this._context.mediaQuery.md.down ? 5 : 10,
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            inset: 0,
            position: "absolute",
            display: this._context.mediaQuery.md.down ? "none" : "inherit",
          }}
        >
          <Box
            component={BannerIconServer}
            sx={{
              right: 25,
              top: 100,
              height: 200,
              width: 200,
              position: "absolute",
              color: "primary.light",
            }}
          />
          <Box
            component={BannerIconScribbleShape}
            sx={{
              right: 280,
              top: 130,
              height: 30,
              width: 30,
              position: "absolute",
              color: "primary.main",
            }}
          />
          <Box
            component={BannerIconLaptop}
            sx={{
              left: 900,
              bottom: 100,
              height: 150,
              width: 150,
              position: "absolute",
              color: "primary.dark",
            }}
          />
          <Box
            component={BannerIconScribbleCloud}
            sx={{
              left: 1100,
              bottom: 150,
              height: 50,
              width: 50,
              position: "absolute",
              color: "primary.main",
            }}
          />
          <Box
            component={BannerIconScribbleArrow2}
            color="primary.secondary"
            sx={{
              left: 1200,
              bottom: 250,
              height: 50,
              width: 50,
              position: "absolute",
            }}
          />
          <Box
            component={BannerIconScribbleCircle}
            sx={{
              left: 200,
              top: 70,
              height: 25,
              width: 25,
              position: "absolute",
              color: "primary.main",
            }}
          />
          <Box
            component={BannerIconAddFiles}
            sx={{
              left: 25,
              top: 150,
              height: 125,
              width: 125,
              position: "absolute",
              color: "primary.dark",
            }}
          />
          <Box
            component={BannerIconScribbleArrow}
            sx={{ left: 200, top: 150, height: 70, width: 70, position: "absolute" }}
          />
          <Box
            component={BannerIconCoding}
            sx={{
              right: "min(950px, 80%)",
              bottom: 100,
              height: 200,
              width: 200,
              position: "absolute",
              color: "primary.dark",
            }}
          />
          <Box
            component={BannerIconScribbleDoubleCircle}
            sx={{
              color: "primary.main",
              right: "min(1200px, 110%)",
              bottom: 100,
              height: 30,
              width: 30,
              position: "absolute",
            }}
          />
        </Container>
        <Stack spacing={5} py={5} alignItems="center" display="flex" zIndex={2}>
          <Typography variant="h1" maxWidth="10em" textAlign="center">
            API metering made{" "}
            <Box component="span" color="primary.main" sx={{ fontWeight: 425 }}>
              simple
            </Box>
            .
          </Typography>
          <Typography variant="body1" textAlign="center">
            We take care of billing, so you can focus on solving important problems.
          </Typography>
          <AppSearchBar />
        </Stack>
      </Box>
    );
  }
}
