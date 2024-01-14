---
sidebar_position: 1
---

# Tutorial - Publish API

FastchargeAPI is an API gateway service that helps meter API usages and charge your customer.

Let's set up your API on **FastchargeAPI in less than 5 minutes**.

## TLDR

```bash
pip install -U fastchargeapi-cli # install cli

fastcharge login

# Create an app
fastcharge app create [APP_NAME] --make-visible

# Create an endpoint at https://example.fastchargeapi.com pointing to https://example.com
fastcharge api add [APP_NAME] --path "/" --destination "https://example.com"

# Create an endpoint at https://example.fastchargeapi.com/someresource/:id pointing to https://example.com/someresource/:id
fastcharge api add [APP_NAME] --path "/someresource/:id" --destination "https://example.com/someresource/:id"

# Create a pricing plan named "Free" that gives 100 free quota to each new user
fastcharge pricing add [APP_NAME] --name Free --monthly-charge 0 --charge-per-request 0 --free-quota 100 --make-visible

# Congrats, that's all!
```

## Getting started

FastchargeAPI is the right choice for you if:

- You have an existing HTTP API service. This can be a REST API, GraphQL, or
  any HTTP server.
- You want to charge API callers on a monthly or a per-request basis.
- You can set up a Stripe account to receive payment in your region.

For the purpose of this tutorial, we will use Google https://google.com as our
HTTP service, and create an app that charges the customer whenever they send a
GET request to our app, which is redirected to Google.

### What you'll need

- [Python](https://www.python.org/) version 3.9 or above:
  - A package manager such as [pip](https://pypi.org/project/pip/) or
    [poetry](https://python-poetry.org/).

## Install the FastchargeAPI cli-tools:

Install the cli tool from pypi:

```bash
pip install -U fastchargeapi-cli
```

You can type this command into Command Prompt, Powershell, Terminal, or any other integrated terminal of your code editor.

The command also all necessary dependencies you need. It will install 2 command-line toos:

- `fastcharge` - tool when you are publishing an app
- `fastapi` - tool when you are using an app published by someone else

## Create your app

Sign in or sign up for the fist time to FastchargeAPI.com:

```bash
fastcharge login
```

A browser window should open. Complete the sign-in and return to the command-line.

After sign-in, create an app with the following command:

```bash
fastcharge app create [APP_NAME]
```

Replace the `[APP_NAME]` with a name you desire for the app. The name is
**case-insensitive**, unique (not registered by someone else), and must:

- Have a length between 2 and 63 characters.
- Contain only lower case letters [a-z], digits [0-9], or hyphens [-].
- Not begin or end with a hyphen.

For example, we use `myapp` as the app name:

```bash
fastcharge app create myapp
```

### Add an API Endpoint

After an app is created, you can add API endpoints to the app. An endpoint
consists of a `path` and a `destination`. Any endpoint of the app becomes available at:

```
https://[APP_NAME].fastchargeapi.com/[PATH]
```

Or in our case,

```
https://myapp.fastchargeapi.com/[PATH]
```

When a customer sends any HTTP request to the url above, the request is billed,
and proxied to the `destination`.

For example, we add an endpoint with the path being `/google` and the
destination being `https://google.com`.

```bash
fastcharge api add myapp --path "/google" --destination "https://google.com"
```

After that, we have a live endpoint https://myapp.fastchargeapi.com/google pointing to https://google.com.

### Create a Pricing Plan

You must provide a pricing plan that your users can subscribe to. Let's create a
plan that offers 100 free quota for users, so that they can try your API without
paying.

```bash
fastcharge pricing add myapp --name Free --free-quota 100 --monthly-charge 0 --charge-per-request 0 --make-visible
```

Here, `--name Free` sets the name of the pricing plan to "Free". `--free-quota
100` means that each new user can make 100 request for free.
`--monthly-charge 0` means that there is no monthly fee for this app.
`--charge-per-request 0` means that there is no per-request fee for this app.
`--make-visible` means that the pricing plan is now visible and can be
subscribed by everyone.

## Final words

That's it! With 3 simple commands, you have created a live app that charges the
customer whenever they make a request.

For the next step, you might be interested in learning [how to use an app
published by someone else](./intro-use-api.md).
