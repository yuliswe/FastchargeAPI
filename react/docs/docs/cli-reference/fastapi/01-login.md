---
sidebar_label: login
---

# fastapi login

Sign in a user account.

## Usage

    fastapi [--profile STRING] login

### Example

    fastapi login

## Available options

### --profile STRING

Optional

Log in and save the user as a profile. This allows you to log in to multiple
accounts and run command as one of them.

When not provided, log in as the default account.

#### Example

    fastapi --profile user1 login
