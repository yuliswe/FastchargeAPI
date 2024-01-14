import { Box, Button, Container, Grid, Paper, Stack, Typography } from "@mui/material";
import React from "react";
import Terminal, { ColorMode, TerminalInput, TerminalOutput } from "react-terminal-ui";
import { RouteURL } from "../routes";

export class HomePageBanner extends React.PureComponent {
  render() {
    return (
      <Box
        py={15}
        sx={{
          // backgroundImage: "linear-gradient(to right, #ffecd2 0%, #fcb69f 100%)",
          bgcolor: "primary.light",
        }}
      >
        <Container maxWidth="xl">
          <Grid container rowSpacing={10} columnSpacing={2}>
            <Grid item xs={6}>
              <Stack spacing={5} py={5}>
                <Typography variant="h1">API Metering Made Simple</Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: 18,
                    width: "70%",
                  }}
                >
                  We take care of billing, so you can focus on solving more important problems.
                </Typography>
                <Box>
                  <Button
                    href={RouteURL.authPage({
                      query: {
                        redirect: RouteURL.myAppsPage(),
                      },
                    })}
                    variant="contained"
                    sx={{
                      fontSize: 18,
                      px: 3,
                      py: 1,
                      fontWeight: 500,
                      borderRadius: 50,
                    }}
                  >
                    Create API
                  </Button>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={6}>
              <Paper
                className="terminal"
                elevation={15}
                sx={{
                  borderRadius: 5,
                }}
              >
                <Terminal colorMode={ColorMode.Dark} height="17em">
                  <TerminalInput>fastcharge app create "myapp"</TerminalInput>
                  <TerminalOutput>Created app "myapp".</TerminalOutput>
                  <TerminalInput>
                    {`fastcharge api add "myapp" --path "/example" \\ \n    --destination "https://example.com"`}
                  </TerminalInput>
                  <TerminalOutput>
                    {`Created endpoint: \n  App:   myapp\n  Path:  /example \n  https://myapp.fastchargeapi.com/example ~> https://example.com`}
                  </TerminalOutput>
                  <TerminalInput>{`curl "https://myapp.fastchargeapi.com/example"`}</TerminalInput>
                </Terminal>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    );
  }
}
