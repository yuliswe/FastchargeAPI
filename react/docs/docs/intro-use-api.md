---
sidebar_position: 1
---

# Tutorial - Use API

In this tutorial, you will learn how to use an API published on FastchargeAPI by
someone else.

For the purpose of this tutorial, we will use the official `myapp` example
that's created in the previous tutorial: [Publish API](./intro-publish-api).

## Install the FastchargeAPI cli-tools:

In case you haven't installed the cli, there's the instruction for installing the cli again:

### What you'll need

-   [Python](https://www.python.org/) version 3.9 or above:
    -   A package manager such as [pip](https://pypi.org/project/pip/) or
        [poetry](https://python-poetry.org/).

Install the cli tool from pypi:

```bash
pip install -U fastchargeapi-cli
```

You can type this command into Command Prompt, Powershell, Terminal, or any other integrated terminal of your code editor.

The command also all necessary dependencies you need. It will install 2 command-line toos:

* `fastapi` - cli when you are using an app published by someone else. This is the tool we'll use.
* `fastcharge` - cli when you are publishing an app 

## Subscribe to a pricing plan

Before using an API, you must be subscribed to a pricing plan offered by the
app. Not All pricing plans charge a monthly subscription fee. And some of the
plans offer free quota.

We will subscribe to the `Free` pricing plan that offers 100 free quota for this app.


First, sign in or sign up for the fist time to FastchargeAPI.com:

```bash
fastapi login
```

Then, run the following command to subscribe to the `Free` plan:

```bash
fastapi subscription sub myapp --plan Free
```


## Create an API token

Next, create an API token (api key) to authenticate the HTTP request:

```bash
fastapi token create myapp
```

Copy the API token from the output.

```
> Save this token! You will not be able to see it again.
eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9************************************
```

## Make request to the app

### List endpoints

Discover available endpoints for this app:

```bash
fastapi api ls myapp
```

```
"myapp" endpoints:

 ID:            endp_WyJteWFwcCIsMTY3NzgwMzUxOTA0NF0
 Endpoint:      https://myapp.fastchargeapi.com/google
 Redirects to google search.
```

Congratulation, now you can use the endpoint in your own applications.


```bash
curl "https://myapp.fastchargeapi.com/google?q=fastchargeapi" \
    -H "X-Fast-API-KEY: [Your Token]"
```

