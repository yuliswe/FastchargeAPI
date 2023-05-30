---
sidebar_label: add
---

# fastcharge api add

Add an endpoint to an app.

## Usage

```bash
fastcharge api add [APP_NAME] [OPTIONS]
```

## Example

```bash
fastcharge api add example --path "/" --method GET --destination "https://example.com"
```

## Arguments:

### APP_NAME

Type: string. Required.

The name of the app to which the endpoints are added.

## Available options:

### --path, -p STRING

Type: string. Required.

The path that the endpoint matches. This can be a simple path, or a path that contains a named path segment such as `:id`.

#### Example

```bash
# Match the root path, eg. https://example.fastchargeapi.com/
--path "/"

# Match a path to /users, eg. https://example.fastchargeapi.com/users
--path "/users"

# Match a path to /users/:id, eg. https://example.fastchargeapi.com/users/:id
--path "/users/:id"
```

#### Using a named segment in path

Paths that contain a segment starting with a colon, eg. `:id`, `:name` are matched dynamically. 

##### Example

```bash
--path "/users/:id"
```

This path matches all these following requests:

    https://example.fastchargeapi.com/users/123 # id == 123
    https://example.fastchargeapi.com/users/abc # id == abc

    https://example.fastchargeapi.com/users/123/ # id == 123
    https://example.fastchargeapi.com/users/abc/ # id == abc

You can have as many named segment as you want. For example,

```bash
--path "/users/:userId/posts/:postId"
```

This path matches:

    https://example.fastchargeapi.com/users/123/posts/abc # userId == 123, postId == abc


### --destination, -d STRING

Type: string. Required.

Where incoming requests to this endpoint are forwarded to.

#### Example

```bash
# Forward requests to https://example.com
--destination "https://example.com" 

# Forward requests to https://example.com/users
--destination "https://example.com/users" 

# Forward requests to https://example.com/users/:id
--destination "https://example.com/users/:id" 
```

#### Using a named segment in destination

Destinations that contain a segment starting with a colon, eg `:id`, `:name` are
replaced with the matched value in the `--path`.

##### Example

```bash
--path "/users/:id" --destination "https://example.com/users/:id" 
```

This forwards requests:

```
https://example.fastchargeapi.com/users/123 ~> https://example.fastchargeapi/users/123
```

```
https://example.fastchargeapi.com/users/abc ~> https://example.fastchargeapi/users/abc
```

##### Example

Similarly you can as many named segments as you want:

```bash
--path "/users/:userId/posts/:postId" --destination "https://example.com/users/:userId/posts/:postId" 
```

This forwards requests:

```
https://example.fastchargeapi.com/users/123/posts/abc ~> https://example.com/users/123/posts/abc
```

### --method, -m ENUM

Value: `GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS`. Required.

Match the HTTP method of the incoming requests.

#### Example

Forward POST requests to the destination:

```bash
--method POST --path "/posts" --destination "https://example.com/posts"
```

### --description STRING

Optional.

Add a short description for this endpoint for documentation purposes. This is
shown in the app page under the endpoints section.

Maximum length: 300
