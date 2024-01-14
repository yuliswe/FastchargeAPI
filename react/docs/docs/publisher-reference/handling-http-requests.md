# Handling HTTP requests

This document explains how FastchargeAPI handles requests and passes them to the destination endpoint.

## TLDR

FastchargeAPI is designed to be a transparent gateway that passes request
headers. body, and query params to the destination unchanged.

:::note
However, a caveat is that since HTTP headers are case insensitive, your
server must be able to handle HTTP headers case insensitively. FastchargeAPI
gateway makes the best effort to keep the original case of the headers, but it
is not always possible.
:::

## HTTP headers

HTTP headers included in the requests are passed to the destination. For
example, if the endpoint is https://example.fastchargeapi.com/echo, and a
request including custom headers is sent to this endpoint:

```bash
curl "https://example.fastchargeapi.com/echo" -X POST -H "X-Custom-Header: custom-header-content"
```

The `X-Custom-Header` is included in the request to the destination of this
endpoint. This allows your server to read any headers in the request.

However, since HTTP headers are case insensitive, the header might appear in
lowercases such as `x-custom-header`. Your server must be able to handle the
cases insensitively.

### Special HTTP headers

#### Request headers

- `Host` - The `Host` header is always set to the domain of the destination.

- `x-fast-user` - A unique identifer that helps identify API users.

- `Accept-Encoding` - This is always set to `identity`.

#### Response headers

- `Content-Encoding` - This is always set to `identity`.

## HTTP body

HTTP body of the request to an endpoint is passed directly to the destination.
For example, if the endpoint is https://example.fastchargeapi.com/echo, and a
request is sent to this endpoint:

```bash
curl "https://example.fastchargeapi.com/echo" -X POST -H "Content-Type: application/json" -d '{"username":"xyz","password":"xyz"}'
```

The request to the destination will contain the same body:

    {"username":"xyz","password":"xyz"}

## URL query

The URL query (content after `?` in a URL) are passed to the destination,
although the order the params may be different from the original requests.

A query key without value is treated the same as the key with an empty string.

For example, a request
https://example.fastchargeapi.com/echo?a=1&a=2&b=3&c will pass
`?a=1&a=2&b=3&c=` to the destination.

```bash
curl "https://example.fastchargeapi.com/echo?a=1&a=2&b=3&c="
```
