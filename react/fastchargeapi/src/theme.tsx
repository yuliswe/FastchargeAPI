import { createTheme } from "@mui/material/styles";
import React from "react";
import { LinkProps as RouterLinkProps } from "react-router-dom";
import { LinkProps } from "@mui/material/Link";
import { HashLink } from "react-router-hash-link";
import "./App.scss";

export function getTheme() {
    const blue = "#3772FF";
    const white = "#E8E9EB";
    const yellow = "#FFC100";
    const black = "#313638";
    const red = "#DF2935";
    const LinkBehavior = React.forwardRef<
        HTMLAnchorElement,
        Omit<RouterLinkProps, "to"> & {
            href: RouterLinkProps["to"];
            isHash: boolean;
        }
    >((props, ref) => {
        const { href, ...other } = props;
        // Map href (MUI) -> to (react-router)
        // if (isHash) {
        return <HashLink ref={ref} to={href} {...other} />;
        // } else {
        //     return <RouterLink ref={ref} to={href} {...other} />;
        // }
    });
    return createTheme({
        // spacing: [0, 4, 8, 16, 32, 64],
        // spacing: (factor: number) => `${0.25 * factor}rem`,
        // spacing: mediaQuerySm ? 2 : mediaQueryMd ? 4 : 8,
        palette: {
            background: {
                default: "#fff",
                paper: white,
            },
            primary: {
                main: yellow,
            },
            secondary: {
                main: black,
            },
            info: {
                main: blue,
            },
        },
        shape: {
            borderRadius: 2,
        },
        components: {
            MuiPaper: {
                defaultProps: {
                    elevation: 0,
                },
            },
            MuiAppBar: {
                defaultProps: {
                    elevation: 1,
                },
            },
            MuiMenu: {
                defaultProps: {
                    elevation: 1,
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 20,
                        textTransform: "none",
                    },
                },
                defaultProps: {
                    LinkComponent: LinkBehavior,
                    // disableElevation: true,
                },
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        borderRadius: 5,
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {},
            },
            MuiTypography: {
                styleOverrides: {
                    h1: {
                        fontFamily: "Finger Paint",
                        fontSize: 50,
                    },
                    h2: {
                        fontFamily: "Ubuntu",
                        fontWeight: 400,
                        fontSize: 40,
                    },
                    h3: {
                        fontFamily: "Finger Paint",
                        fontSize: 30,
                    },
                    body1: {
                        fontFamily: "Roboto",
                    },
                },
            },
            MuiLink: {
                styleOverrides: {
                    root: {
                        textDecoration: "none",
                        // "&:hover": {
                        //     textDecoration: "underline",
                        // },
                    },
                },
                defaultProps: {
                    color: "primary.contrastText",
                    underline: "hover",
                    component: LinkBehavior,
                } as LinkProps,
            },
        },
    });
}
