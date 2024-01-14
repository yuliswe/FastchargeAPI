# Requirement for using FastchargeAPI gateway

## Protocols

Our gateway current supports the HTTP protocol, which includes the REST, GraphQL, and other HTTP based APIs. In the future, we will also support Websocket APIs and TCP proxy.

| HTTP API | REST API | GraphQL | Websocket | TCP |
| -------- | -------- | ------- | --------- | --- |
| Yes      | Yes      | Yes     | WIP       | WIP |

## Respond time

Currently, the maximum allowed response time is 250ms.

To provide a better experience and keep the price low for everyone using the
FastchargeAPI gateway, currently a maximum response time is imposed. When a
customer sends a request, your API (endpoint destination) must be able to
respond to the gateway in 250ms. Timed-out requests may result in a `408 Request
Timeout` response.

## Payload

Currently, the maximum payload size supported is 6MB.

## Content type

Currently, any non-binary type of responses, such as `application/json` or
`text/html` are supported.
