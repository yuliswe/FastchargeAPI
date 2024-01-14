---
sidebar_label: Overview
---

# Fastcharge CLI

fastcharge is a CLI for publishing APIs.

# global options

## Usage

    fastcharge [GLOBAL OPTIONS] subcommand [SUBCMD OPTIONS]

## Available global options

### --profile STRING

Specify a user to run the command as.

#### Example

Login a user account and save the credential in a profile named "adminuser":

    fastcharge --profile adminuser login

#### Example

Run the list apps command as the "adminuser" user:

    fastcharge --profile adminuser app list
