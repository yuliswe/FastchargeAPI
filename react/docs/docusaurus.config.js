// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').Config} */
const config = {
    title: "FastchargeAPI",
    tagline: "Publish and sell your APIs in 5 minutes",
    favicon: "img/favicon.ico",

    // Set the production url of your site here
    url: "https://doc.fastchargeapi.com",
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: "/",

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: "FastchargeAPI", // Usually your GitHub org/user name.
    projectName: "FastchargeAPI", // Usually your repo name.

    onBrokenLinks: "throw",
    onBrokenMarkdownLinks: "warn",

    staticDirectories: ["static"],

    // Even if you don't use internalization, you can use this field to set useful
    // metadata like html lang. For example, if your site is Chinese, you may want
    // to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: "en",
        locales: ["en"],
    },

    plugins: ["docusaurus-plugin-sass"],

    presets: [
        [
            "classic",
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: {
                    sidebarPath: require.resolve("./sidebars.js"),
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl:
                        "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
                },
                blog: {
                    showReadingTime: true,
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl:
                        "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
                },
                theme: {
                    customCss: [require.resolve("./src/css/custom.scss")],
                },
            }),
        ],
    ],

    themeConfig:
        /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
        ({
            // Replace with your project's social card
            image: "img/docusaurus-social-card.jpg",
            navbar: {
                title: "Documentation",
                logo: {
                    alt: "FastchargeAPI Logo",
                    src: "img/logo5.svg",
                },
                items: [
                    {
                        type: "doc",
                        docId: "intro-publish-api",
                        position: "left",
                        label: "Tutorial",
                    },
                    // { to: "/blog", label: "Blog", position: "left" },
                    {
                        href: "https://fastchargeapi.com",
                        label: "FastchargeAPI",
                        position: "right",
                        target: "_self",
                    },
                ],
            },
            footer: {
                style: "dark",
                logo: {
                    alt: "FastchargeAPI Logo",
                    src: "img/logo5.svg",
                },
                links: [
                    {
                        title: "FastchargeAPI",
                        items: [
                            {
                                label: "API metering made simple.",
                                to: "https://fastchargeapi.com",
                            },
                        ],
                    },
                    {
                        title: "Resources",
                        items: [
                            {
                                label: "Home",
                                to: "https://fastchargeapi.com",
                            },
                            {
                                label: "Pricing",
                                to: "https://fastchargeapi.com/terms-of-service#pricing",
                            },
                        ],
                    },
                    {
                        title: "Tutorials",
                        items: [
                            {
                                label: "Publish APIs",
                                to: "/docs/intro-publish-api",
                            },
                            {
                                label: "Use APIs",
                                to: "/docs/intro-use-api",
                            },
                        ],
                    },
                    {
                        title: "Community",
                        items: [
                            {
                                label: "Report an Issue",
                                href: "https://github.com/FastchargeAPI/fastchargeapi-cli/issues",
                            },
                            {
                                label: "Get help on Discord",
                                href: "https://discord.gg/HfQDWjkJ7n",
                            },
                        ],
                    },
                    {
                        title: "Legal",
                        items: [
                            {
                                label: "Privacy",
                                to: "https://fastchargeapi.com/terms-of-service#privacy",
                            },
                            {
                                label: "Terms of Service",
                                to: "https://fastchargeapi.com/terms-of-service",
                            },
                        ],
                    },
                ],
                copyright: `Copyright © ${new Date().getFullYear()} FastchargeAPI.com`,
            },
            prism: {
                theme: lightCodeTheme,
                darkTheme: darkCodeTheme,
            },
        }),
};

module.exports = config;
