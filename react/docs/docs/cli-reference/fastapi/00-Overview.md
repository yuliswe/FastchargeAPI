---
sidebar_label: Overview
---

# Fastapi CLI

Fastapi is a CLI for managing your subscriptions as an API user.

# global options

## Usage

    fastapi [GLOBAL OPTIONS] subcommand [SUBCMD OPTIONS]

## Available global options

### --profile STRING

Specify a user to run the command as.

#### Example

Login a user account and save the credential in a profile named "user1":

    fastapi --profile user1 login

#### Example

Run the list apps command as the "user1" user:

    fastapi --profile user1 app list
