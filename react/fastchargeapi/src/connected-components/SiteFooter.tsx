import { Box, ButtonBase, Container, Grid, IconButton, Link, Stack, Typography } from "@mui/material";
import React from "react";
import { AppContext, ReactAppContextType } from "../AppContext";
import { ReactComponent as DiscordIcon } from "../svg/discord.svg";
import { ReactComponent as GithubIcon } from "../svg/github-solid.svg";
import { ReactComponent as Logo } from "../svg/logo5.svg";

const githubRepoLink = "https://github.com/FastchargeAPI/fastchargeapi-cli/issues";
const discordInviteLink = "https://discord.gg/HfQDWjkJ7n";

export class SiteFooter extends React.PureComponent {
    static contextType = ReactAppContextType;
    get _context() {
        return this.context as AppContext;
    }

    renderLogo() {
        return (
            <ButtonBase href="/" sx={{ p: 0 }}>
                <Stack direction="row" alignItems="center">
                    <Logo style={{ width: 35 }} />
                    <Typography variant="h3">FastchargeAPI</Typography>
                </Stack>
            </ButtonBase>
        );
    }

    renderSocialMediaLinks() {
        const socialMediaLinks = [
            {
                name: "Discord",
                icon: <DiscordIcon height="80%" width="80%" />,
                href: discordInviteLink,
            },
            {
                name: "GitHub",
                icon: <GithubIcon height="80%" width="80%" />,
                href: githubRepoLink,
            },
        ];
        return (
            <Stack direction="row" spacing={2} mt={5}>
                {socialMediaLinks.map((link) => (
                    <IconButton
                        key={link.name}
                        target="_blank"
                        sx={{ width: 40, height: 40, bgcolor: "primary.light", color: "primary.main" }}
                        href={link.href}
                    >
                        {link.icon}
                    </IconButton>
                ))}
            </Stack>
        );
    }

    render() {
        return (
            <Box sx={{ p: 5, pb: 10 }} component="footer">
                <Container maxWidth="lg">
                    <Grid container spacing={5}>
                        <Grid item xs={this._context.mediaQuery.md.down ? 12 : 3}>
                            {this.renderLogo()}
                            <Typography variant="body1" mt={2}>
                                API metering made simple.
                            </Typography>
                            {this.renderSocialMediaLinks()}
                        </Grid>
                        <Grid item xs={this._context.mediaQuery.md.down ? 6 : 3}>
                            <Typography variant="h5" mb={2}>
                                Resources
                            </Typography>
                            <Stack spacing={1}>
                                <Link href="/terms-of-service#pricing">Pricing</Link>
                                <Link href="https://doc.fastchargeapi.com" target="_blank">
                                    <Typography variant="body1">Documentation</Typography>
                                </Link>
                            </Stack>
                        </Grid>
                        <Grid item xs={this._context.mediaQuery.md.down ? 6 : 3}>
                            <Typography variant="h5" mb={2}>
                                Report
                            </Typography>
                            <Stack spacing={1}>
                                <Link href={githubRepoLink} target="_blank" display="flex" alignItems="center">
                                    Report an Issue
                                </Link>
                                <Link href={discordInviteLink} target="_blank">
                                    Get help on Discord
                                </Link>
                            </Stack>
                        </Grid>
                        <Grid item xs={this._context.mediaQuery.md.down ? 6 : 3}>
                            <Typography variant="h5" mb={2}>
                                Legal
                            </Typography>
                            <Stack spacing={1}>
                                <Link href="/terms-of-service#privacy">Privacy</Link>
                                <Link href="/terms-of-service#tos">Terms of Service</Link>
                            </Stack>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        );
    }
}
