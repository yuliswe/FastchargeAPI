---
sidebar_label: update
---

# fastcharge account update

Update attributes of your user account.

## Usage

    fastcharge account update [OPTIONS]

## Available options

### --author STRING

Update the username of your account. This is displayed as the author field for apps published by you.

The name is case sensitive, contains only [A-z], spaces, dashes or underscore characters.

The maximum length is 30.

Must be unique.

#### Example

    fastcharge account update --author Jedi
