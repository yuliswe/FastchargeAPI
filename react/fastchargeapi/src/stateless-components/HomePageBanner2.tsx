import { Box, Container, Stack, Typography } from "@mui/material";
import React from "react";
import { AppContext, ReactAppContextType } from "src/AppContext";
import { ReactComponent as BannerIconAddFiles } from "src/svg/banner-icon-add-files.svg";
import { ReactComponent as BannerIconCoding } from "src/svg/banner-icon-coding.svg";
import { ReactComponent as BannerIconLaptop } from "src/svg/banner-icon-laptop.svg";
import { ReactComponent as BannerIconScribbleArrow } from "src/svg/banner-icon-scribble-arrow.svg";
import { ReactComponent as BannerIconScribbleArrow2 } from "src/svg/banner-icon-scribble-arrow2.svg";
import { ReactComponent as BannerIconScribbleCircle } from "src/svg/banner-icon-scribble-circle.svg";
import { ReactComponent as BannerIconScribbleCloud } from "src/svg/banner-icon-scribble-cloud.svg";
import { ReactComponent as BannerIconScribbleDoubleCircle } from "src/svg/banner-icon-scribble-double-circle.svg";
import { ReactComponent as BannerIconScribbleShape } from "src/svg/banner-icon-scribble-shape.svg";
import { ReactComponent as BannerIconServer } from "src/svg/banner-icon-server.svg";
import { AppSearchBar } from "src/stateless-components/AppSearchBar";
export class HomePageBanner2 extends React.PureComponent {
  static contextType = ReactAppContextType;
  get _context() {
    return this.context as AppContext;
  }

  renderRightBox() {
    return (
      <Box sx={{ position: "relative", flexGrow: 1 }}>
        <Box
          component={BannerIconServer}
          sx={{
            left: "20%",
            top: "15%",
            height: 200,
            width: 200,
            position: "absolute",
            color: "primary.light",
          }}
        />
        {this._context.mediaQuery.xl.up && (
          <Box
            component={BannerIconLaptop}
            sx={{
              left: 0,
              top: "60%",
              height: 150,
              width: 150,
              position: "absolute",
              color: "primary.dark",
            }}
          />
        )}
        <Box
          component={BannerIconScribbleCloud}
          sx={{
            left: "70%",
            top: "70%",
            height: 50,
            width: 50,
            position: "absolute",
            color: "primary.main",
          }}
        />
        {this._context.mediaQuery.xl.up && (
          <Box
            component={BannerIconScribbleArrow2}
            color="primary.secondary"
            sx={{
              left: "80%",
              bottom: 250,
              height: 50,
              width: 50,
              position: "absolute",
            }}
          />
        )}
        <Box
          component={BannerIconScribbleShape}
          sx={{
            left: "10%",
            top: "10%",
            height: 30,
            width: 30,
            position: "absolute",
            color: "primary.main",
          }}
        />
      </Box>
    );
  }

  renderLeftBox() {
    return (
      <Box sx={{ position: "relative", flexGrow: 1 }}>
        <Box
          component={BannerIconScribbleCircle}
          sx={{
            right: "10%",
            top: "10%",
            height: 25,
            width: 25,
            position: "absolute",
            color: "primary.main",
          }}
        />
        {this._context.mediaQuery.xl.up && (
          <Box
            component={BannerIconAddFiles}
            sx={{
              right: "60%",
              top: "15%",
              height: 100,
              width: 100,
              position: "absolute",
              color: "primary.dark",
            }}
          />
        )}
        <Box
          component={BannerIconScribbleArrow}
          sx={{ right: "10%", top: "25%", height: 70, width: 70, position: "absolute" }}
        />
        <Box
          component={BannerIconCoding}
          sx={{
            right: "5%",
            top: "45%",
            height: 200,
            width: 200,
            position: "absolute",
            color: "primary.dark",
          }}
        />
        {this._context.mediaQuery.xl.up && (
          <Box
            component={BannerIconScribbleDoubleCircle}
            sx={{
              color: "primary.main",
              top: "80%",
              right: "80%",
              bottom: 100,
              height: 30,
              width: 30,
              position: "absolute",
            }}
          />
        )}
      </Box>
    );
  }

  renderCenterBox() {
    return (
      <Stack spacing={5} py={10} mx={10} alignItems="center" display="flex">
        <Typography variant="h1" maxWidth="10em" textAlign="center">
          Create revenue from your{" "}
          <Box component="span" color="primary.main" sx={{ fontWeight: 425 }}>
            APIs
          </Box>
          .
        </Typography>
        <Typography variant="body1" textAlign="center">
          Publish your SaaS APIs here and start generating revenue from millions of developers.
        </Typography>
        <Stack direction="row" alignSelf="stretch" px={10}>
          <AppSearchBar />
        </Stack>
      </Stack>
    );
  }

  render() {
    return (
      <Box // background
        sx={{
          position: "relative",
          bgcolor: "primary.light",
          overflow: "hidden",
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            inset: 0,
            display: this._context.mediaQuery.md.down ? "none" : "inherit",
          }}
        >
          <Stack
            direction="row"
            sx={{
              alignItems: "stretch",
              justifyContent: "space-around",
            }}
          >
            {this._context.mediaQuery.lg.up && this.renderLeftBox()}
            {this.renderCenterBox()}
            {this._context.mediaQuery.lg.up && this.renderRightBox()}
          </Stack>
        </Container>
      </Box>
    );
  }
}
