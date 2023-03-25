import { createTheme } from "@mui/material/styles";
import React from "react";
import { LinkProps as RouterLinkProps } from "react-router-dom";
import { LinkProps } from "@mui/material/Link";
import { HashLink } from "react-router-hash-link";
import "./App.scss";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

declare module "@mui/material/styles" {
    interface TypographyVariants {
        label: React.CSSProperties;
    }

    // allow configuration using `createTheme`
    interface TypographyVariantsOptions {
        label?: React.CSSProperties;
    }
}

// Update the Typography's variant prop options
declare module "@mui/material/Typography" {
    interface TypographyPropsVariantOverrides {
        label: true;
    }
}

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
        typography: {
            label: {
                fontSize: 16,
                fontWeight: 500,
            },
        },
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
                        fontFamily: "FingerPaint",
                        fontSize: 50,
                    },
                    h2: {
                        fontFamily: "Ubuntu",
                        fontWeight: 400,
                        fontSize: 40,
                    },
                    h3: {
                        fontFamily: "FingerPaint",
                        fontSize: 30,
                    },
                    body1: {
                        fontFamily: "Roboto",
                    },
                },
                defaultProps: {
                    variantMapping: {
                        label: "h6",
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
