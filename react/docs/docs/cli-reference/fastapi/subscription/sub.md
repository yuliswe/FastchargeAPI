# sub

Subscribe to an app.

## Usage

```bash
fastapi subscription sub [APP_NAME] --plan [PRICING_ID]
```

## Arguments:

### APP_NAME

Name of the app to subscribe to.


## Available options:

### --plan STRING

Type: string. Required.

Specify a pricing plan to subscribe to an app.

The pricing id can be obtained by [`fastapi pricing list`](../pricing/list).