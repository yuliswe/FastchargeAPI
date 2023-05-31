import { HelpOutlineRounded } from "@mui/icons-material";
import { Box, ButtonBase, IconButton, Paper, Popover, Typography } from "@mui/material";
import React from "react";
import Terminal, { ColorMode, TerminalInput } from "react-terminal-ui";
import { StepsCarousel } from "./StepsCarousel";

type Step = {
    title: string;
    input: string[];
    output: string[];
    help: string;
    params: [string, string][];
};
const digits = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const steps: Step[] = [
    {
        title: "Create an app that will host your APIs.",
        input: [`fastcharge app create "my-first-app"`, `    --title "Hello world"`],
        output: ["App created."],
        help: `This command creates an app with the name "my-first-app".`,
        params: [["--title", "The title of your app."]],
    },
    {
        title: "Add an API to your app.",
        input: [
            `fastcharge api add "my-first-app"`,
            `    --path "/example"`,
            `    --destination "https://example.com"`,
        ],
        output: ["Endpoint created."],
        help: `This command creates an API endpoint with the path "/example" that redirects to "https://example.com".`,
        params: [
            ["--path", "The path of your API endpoint."],
            ["--destination", "The destination URL of your API endpoint."],
        ],
    },
    {
        title: "Create a pricing plan.",
        input: [
            `fastcharge pricing add "my-first-app"`,
            `    --name "Basic Plan"`,
            `    --charge-per-request 0.0001`,
            `    --monthly-charge 1.50`,
            `    --free-quota 1000`,
        ],
        output: ["Pricing plan created."],
        help: `This command creates a pricing plan with the name "Basic Plan" that charges $1.50 per month and $0.0001 per request after the first 1000 requests. The first 1000 requests are free.`,
        params: [
            ["--name", "The name of your pricing plan."],
            ["--charge-per-request", "The amount to charge per request after the free quota is exceeded."],
            ["--monthly-charge", "The amount to charge per month."],
            ["--free-quota", "The number of free requests per month."],
        ],
    },
    {
        title: "Release! (That's it!)",
        input: [`fastcharge app publish "my-first-app"`],
        output: ["Pricing plan created."],
        help: `This command makes your app public so that anyone can use it.`,
        params: [["--visibility", "The visibility of your app. Can be either 'public' or 'private'."]],
    },
];

type State = {
    currentPageElement: HTMLElement | null;
    currentPage: number;
    openHelper: boolean;
};
export type HomePagePublisherTutorialCarouselProps = {};
export class HomePagePublisherTutorialCarousel extends React.Component<HomePagePublisherTutorialCarouselProps, State> {
    constructor(props: HomePagePublisherTutorialCarouselProps) {
        super(props);
        this.state = {
            currentPageElement: null,
            currentPage: 0,
            openHelper: false,
        };
    }

    openHelper() {
        this.setState({
            openHelper: true,
        });
    }

    closeHelper() {
        this.setState({
            openHelper: false,
        });
    }

    render() {
        return (
            <React.Fragment>
                <StepsCarousel<Step>
                    stackProps={{
                        spacing: 2,
                        p: 2,
                    }}
                    pages={steps}
                    renderHeader={(currentPage) => (
                        <Box mt={5}>
                            <Typography variant="h1" sx={{ color: "primary.main", my: 1 }}>
                                Step {digits[currentPage + 1]}
                            </Typography>{" "}
                            <Typography variant="h5">{steps[currentPage].title}</Typography>
                        </Box>
                    )}
                    iconButtonsOffsetY={-28}
                    onPageChange={(currentPage, totalPages, pageElement) => {
                        this.setState({
                            currentPageElement: pageElement,
                            currentPage,
                        });
                    }}
                    renderPage={(step, index, currentPage, totalPages) => (
                        <Box sx={{}} key={step.title}>
                            <Paper
                                elevation={10}
                                sx={{
                                    overflow: "hidden",
                                    minWidth: 450,
                                    minHeight: 252,
                                    height: 252,
                                    bgcolor: index === currentPage ? "primary.dark" : "primary.light",
                                }}
                            >
                                <ButtonBase
                                    sx={{
                                        height: "100%",
                                        width: "100%",
                                        ":hover": {
                                            backgroundColor: index === currentPage ? "transparent" : "action.hover",
                                        },
                                        fontFamily: "inherit",
                                        fontSize: "inherit",
                                        color: "inherit",
                                        fontWeight: "inherit",
                                        justifyContent: "inherit",
                                        textAlign: "inherit",
                                    }}
                                    disableRipple={index === currentPage}
                                >
                                    <Terminal
                                        colorMode={index === currentPage ? ColorMode.Dark : ColorMode.Light}
                                        height="100%"
                                    >
                                        <TerminalInput>{step.input.join(" \\\n")}</TerminalInput>
                                        {/* <Box color="#3EC930" fontWeight={800} mt={1}>
                        <TerminalOutput>{step.output.join("\n")}</TerminalOutput>
                    </Box> */}
                                    </Terminal>
                                </ButtonBase>
                            </Paper>
                            <Typography
                                variant="subtitle1"
                                alignItems={"center"}
                                justifyContent={"center"}
                                display="flex"
                                sx={{ my: 2, textAlign: "center", fontWeight: currentPage === index ? 800 : 400 }}
                            >
                                Step {index + 1}: {step.title}
                                <IconButton
                                    color="info"
                                    size="small"
                                    disabled={currentPage !== index}
                                    onClick={() => {
                                        this.openHelper();
                                    }}
                                >
                                    <HelpOutlineRounded />
                                </IconButton>
                            </Typography>
                        </Box>
                    )}
                ></StepsCarousel>
                <Popover
                    open={this.state.openHelper}
                    anchorEl={this.state.currentPageElement}
                    onClose={() => {
                        this.closeHelper();
                    }}
                    anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "left",
                    }}
                    PaperProps={{
                        sx: {
                            p: 5,
                            bgcolor: "primary.dark",
                            maxWidth: 500,
                        },
                    }}
                >
                    <Typography variant="h6" sx={{ mb: 2 }} color="primary.contrastText" fontFamily="monospace">
                        [Help]
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }} color="primary.contrastText" fontFamily="monospace">
                        {steps[this.state.currentPage].help}
                    </Typography>
                    {steps[this.state.currentPage].params.map(([arg, help]) => (
                        <Typography
                            key={arg}
                            variant="h6"
                            color="primary.contrastText"
                            fontFamily="monospace"
                            sx={{
                                pl: "1em",
                                textIndent: "-1em",
                            }}
                        >
                            {arg}
                            {": "}
                            <Typography variant="body2" component="span" fontFamily="monospace">
                                {help}
                            </Typography>
                        </Typography>
                    ))}
                </Popover>
            </React.Fragment>
        );
    }
}
