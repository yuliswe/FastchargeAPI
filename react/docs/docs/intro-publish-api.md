---
sidebar_position: 1
---

# Tutorial - Publish API

FastchargeAPI is an API gateway service that helps meter API usages and charge your customer.

Let's set up your API on **FastchargeAPI in less than 5 minutes**.

## Getting started

FastchargeAPI is the right choice for you if:

* You have an existing HTTP API service. This can be a REST API, GraphQL, or
  any HTTP server. 
* You want to charge API callers on a monthly or a per-request basis.
* You can set up a Stripe account to receive payment in your region.


For the purpose of this tutorial, we will use Google https://google.com as our
HTTP service, and create an app that charges the customer whenever they send a
GET request to our app, which is redirected to Google.


### What you'll need

-   [Python](https://www.python.org/) version 3.9 or above:
    -   A package manager such as [pip](https://pypi.org/project/pip/) or
        [poetry](https://python-poetry.org/).

## Install the FastchargeAPI cli-tools:

Install the cli tool from pypi:

```bash
pip install -U fastchargeapi-cli
```

You can type this command into Command Prompt, Powershell, Terminal, or any other integrated terminal of your code editor.

The command also all necessary dependencies you need. It will install 2 command-line toos:

* `fastcharge` - tool when you are publishing an app 
* `fastapi` - tool when you are using an app published by someone else

## Create your app

Sign in or sign up for the fist time to FastchargeAPI.com:

```bash
fastcharge login
```

A browser window should open. Complete the sign-in and return to the command-line.

After sign-in, create an app with the following command:

```bash
fastcharge app create [NAME]
```

Replace the `[NAME]` with a name you desire for the app. The name is
**case-insensitive**, unique (not registered by someone else), and must:

* Have a length between 2 and 63 characters.
* Contain only lower case letters [a-z], digits [0-9], or hyphens [-].
* Not begin or end with a hyphen.

For example, we use `myapp` as the app name:

```bash
fastcharge app create "myapp"
```


### Add an API Endpoint

After an app is created, you can add API endpoints to the app. An endpoint
consists of a `path` and a `destination`. Any endpoint of the app becomes available at:

```
https://[APP_NAME].fastchargeapi.com/[PATH]
```

When a customer sends any HTTP request to the url above, the request is billed,
and proxied to the `destination`.

For example, we add an endpoint with the path being `/google` and the
destination being `https://google.com`.


```bash
fastcharge api add --app "myapp" --path "/google" --destination "https://google.com"
```

After that, we have a live endpoint https://myapp.fastchargeapi.com/google pointing to https://google.com.

## Final words

That's it! With 3 simple commands, you have created a live app that charges the
customer whenever they make a request.

For the next step, you might be interested in learning how to use an app
published by someone else.
