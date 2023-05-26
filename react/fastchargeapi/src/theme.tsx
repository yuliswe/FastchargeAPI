import "@fontsource/nunito";
import "@fontsource/nunito/500.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/source-sans-pro/400.css";
import "@fontsource/source-sans-pro/600.css";
import "@fontsource/source-sans-pro/700.css";
import "@fontsource/ubuntu";
import "@fontsource/ubuntu/300.css";
import "@fontsource/ubuntu/400.css";
import "@fontsource/ubuntu/500.css";
import "@fontsource/ubuntu/700.css";
import { LinkProps } from "@mui/material/Link";
import { grey } from "@mui/material/colors";
import "@mui/material/styles";
import { ThemeOptions, createTheme, darken, lighten } from "@mui/material/styles";
import type { Shadows } from "@mui/material/styles/shadows";
import { deepmerge } from "@mui/utils";
import React from "react";
import { LinkProps as RouterLinkProps } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import "./App.scss";

declare module "@mui/material/styles" {
    interface TypographyVariants {
        label: React.CSSProperties;
    }

    // allow configuration using `createTheme`
    interface TypographyVariantsOptions {
        label?: React.CSSProperties;
    }

    // interface PaletteOptions {
    //     black?: PaletteColorOptions;
    // }
}

// Update the Typography's variant prop options
declare module "@mui/material/Typography" {
    interface TypographyPropsVariantOverrides {
        label: true;
    }
}

// declare module "@mui/material/Button" {
//     interface ButtonPropsColorOverrides {
//         black: true;
//     }
// }

// declare module "@mui/material/IconButton" {
//     interface IconButtonPropsColorOverrides {
//         black: true;
//     }
// }

const shadowScale = 0.5;
const shadowKeyUmbraOpacity = 0.2 * shadowScale;
const shadowKeyPenumbraOpacity = 0.14 * shadowScale;
const shadowAmbientShadowOpacity = 0.12 * shadowScale;
function createShadow(...px: number[]) {
    px[1] = px[5] = px[9] = 0;
    return [
        `${px[0]}px ${px[1]}px ${px[2]}px ${px[3]}px rgba(0,0,0,${shadowKeyUmbraOpacity})`,
        `${px[4]}px ${px[5]}px ${px[6]}px ${px[7]}px rgba(0,0,0,${shadowKeyPenumbraOpacity})`,
        `${px[8]}px ${px[9]}px ${px[10]}px ${px[11]}px rgba(0,0,0,${shadowAmbientShadowOpacity})`,
    ].join(",");
}

const shadows: Shadows = [
    "none",
    //           x  y  b  s   x  y  b  s  x  y  b  s
    createShadow(0, 2, 1, -1, 0, 1, 1, 0, 0, 1, 3, 0),
    createShadow(0, 3, 1, -2, 0, 2, 2, 0, 0, 1, 5, 0),
    createShadow(0, 3, 3, -2, 0, 3, 4, 0, 0, 1, 8, 0),
    createShadow(0, 2, 4, -1, 0, 4, 5, 0, 0, 1, 10, 0),
    createShadow(0, 3, 5, -1, 0, 5, 8, 0, 0, 1, 14, 0),
    createShadow(0, 3, 5, -1, 0, 6, 10, 0, 0, 1, 18, 0),
    createShadow(0, 4, 5, -2, 0, 7, 10, 1, 0, 2, 16, 1),
    createShadow(0, 5, 5, -3, 0, 8, 10, 1, 0, 3, 14, 2),
    createShadow(0, 5, 6, -3, 0, 9, 12, 1, 0, 3, 16, 2),
    createShadow(0, 6, 6, -3, 0, 10, 14, 1, 0, 4, 18, 3),
    createShadow(0, 6, 7, -4, 0, 11, 15, 1, 0, 4, 20, 3),
    createShadow(0, 7, 8, -4, 0, 12, 17, 2, 0, 5, 22, 4),
    createShadow(0, 7, 8, -4, 0, 13, 19, 2, 0, 5, 24, 4),
    createShadow(0, 7, 9, -4, 0, 14, 21, 2, 0, 5, 26, 4),
    createShadow(0, 8, 9, -5, 0, 15, 22, 2, 0, 6, 28, 5),
    createShadow(0, 8, 10, -5, 0, 16, 24, 2, 0, 6, 30, 5),
    createShadow(0, 8, 11, -5, 0, 17, 26, 2, 0, 6, 32, 5),
    createShadow(0, 9, 11, -5, 0, 18, 28, 2, 0, 7, 34, 6),
    createShadow(0, 9, 12, -6, 0, 19, 29, 2, 0, 7, 36, 6),
    createShadow(0, 10, 13, -6, 0, 20, 31, 3, 0, 8, 38, 7),
    createShadow(0, 10, 13, -6, 0, 21, 33, 3, 0, 8, 40, 7),
    createShadow(0, 10, 14, -6, 0, 22, 35, 3, 0, 8, 42, 7),
    createShadow(0, 11, 14, -7, 0, 23, 36, 3, 0, 9, 44, 8),
    createShadow(0, 11, 15, -7, 0, 24, 38, 3, 0, 9, 46, 8),
];

const blue = "#3772FF";
const bgWhite = "#fff";
const bgGrey = "#E8E9EB";
const yellow = "#FFC100";
const black = "#313638";
const red = "#DF2935";
const pink = "#CA907E";
const green = "#00CC66";

const primary = blue;
const primaryLight = lighten(blue, 0.9);
const secondary = black;
const secondaryLight = lighten(black, 0.2);
const warning = yellow;
const warningLight = lighten(yellow, 0.97);
const warningDark = darken(yellow, 0.2);
const success = green;
const successLight = lighten(green, 0.85);
const successDark = darken(green, 0.2);
const error = red;
const errorLight = lighten(red, 0.85);
const errorDark = darken(red, 0.2);

export function getTheme(extraThemeOpts?: ThemeOptions) {
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

    const fontSize = (typeof extraThemeOpts?.typography != "function" && extraThemeOpts?.typography?.fontSize) || 14;
    const htmlFontSize =
        (typeof extraThemeOpts?.typography != "function" && extraThemeOpts?.typography?.htmlFontSize) || 16;

    // This formula is copied from the material-ui docs.
    const coef = fontSize / 14;
    const pxToRem = (size: number) => `${(size / htmlFontSize) * coef}rem`;

    return createTheme(
        deepmerge(
            {
                typography: {},
                palette: {
                    common: {
                        black,
                        white: bgWhite,
                    },
                    background: {
                        default: bgWhite,
                        paper: bgWhite,
                    },
                    primary: {
                        main: primary,
                        light: primaryLight,
                    },
                    secondary: {
                        main: secondary,
                        light: secondaryLight,
                    },
                    // black: {
                    //     main: black,
                    //     light: lighten(black, 0.9),
                    //     contrastText: "#fff",
                    // },
                    info: {
                        main: blue,
                    },
                    warning: {
                        main: warning,
                        light: warningLight,
                    },
                    success: {
                        main: success,
                        light: successLight,
                        dark: successDark,
                    },
                    text: {
                        primary: black,
                        secondary: black,
                    },
                },
                shadows,
                shape: {
                    borderRadius: 1,
                },
                components: {
                    MuiPaper: {
                        styleOverrides: {
                            root: {
                                borderRadius: 20,
                            },
                        },
                        defaultProps: {
                            elevation: 3,
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
                            containedSecondary: {
                                ":hover": {
                                    backgroundColor: secondaryLight,
                                },
                            },
                            contained: {
                                ":hover": {
                                    color: "#fff", // This fixes the hover color when the button is a Link component
                                },
                            },
                        },
                    },
                    MuiButtonBase: {
                        styleOverrides: {
                            root: {},
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
                                fontFamily: "Ubuntu",
                                fontSize: pxToRem(50),
                                fontWeight: 400,
                            },
                            h2: {
                                fontFamily: "Ubuntu",
                                fontSize: pxToRem(30),
                                fontWeight: 700,
                            },
                            h3: {
                                fontFamily: "Ubuntu",
                                fontSize: pxToRem(20),
                                fontWeight: 600,
                            },
                            h4: {
                                fontFamily: "Ubuntu",
                                fontSize: pxToRem(18),
                                fontWeight: 800,
                            },
                            h5: {
                                fontFamily: "Ubuntu",
                                fontSize: pxToRem(16),
                                fontWeight: 800,
                            },
                            h6: {
                                fontFamily: "Roboto",
                                fontSize: pxToRem(15),
                                fontWeight: 800,
                            },
                            label: {
                                fontFamily: "Roboto",
                                fontSize: pxToRem(15),
                                fontWeight: 800,
                            },
                            body1: {
                                fontFamily: "Roboto",
                                fontSize: pxToRem(16),
                            },
                        },
                        defaultProps: {
                            variantMapping: {
                                label: "h6",
                            },
                            component: "div",
                        },
                    },
                    MuiIconButton: {
                        styleOverrides: {
                            colorSecondary: {
                                color: grey[600],
                            },
                        },
                    },
                    MuiChip: {
                        styleOverrides: {
                            colorPrimary: {
                                backgroundColor: primaryLight,
                                color: primary,
                                fontWeight: 800,
                            },
                            colorInfo: {
                                backgroundColor: primaryLight,
                                color: primary,
                                fontWeight: 800,
                            },
                            colorSuccess: {
                                backgroundColor: successLight,
                                color: successDark,
                                fontWeight: 800,
                            },
                            colorWarning: {
                                backgroundColor: lighten(warning, 0.8),
                                color: warningDark,
                                fontWeight: 800,
                            },
                            colorError: {
                                backgroundColor: errorLight,
                                color: errorDark,
                                fontWeight: 800,
                            },
                        },
                    },
                    MuiLink: {
                        styleOverrides: {
                            root: {
                                // textDecoration: "none",
                                "&:hover": {
                                    color: blue,
                                },
                            },
                        },
                        defaultProps: {
                            color: black,
                            underline: "none",
                            component: LinkBehavior,
                        } as LinkProps,
                    },
                    MuiSkeleton: {
                        defaultProps: {
                            animation: "wave",
                            variant: "rounded",
                        },
                    },
                },
            },
            extraThemeOpts
        )
    );
}

export function getThemeWithWhiteBackground(extraThemeOpts?: ThemeOptions) {
    return getTheme({
        ...extraThemeOpts,
        palette: {
            background: {
                default: bgWhite,
                paper: bgWhite,
            },
        },
    });
}
