# delete

:::danger
This command may cause you financial loss. Read carefully.
:::

Delete an app created by you.

If your app is actively accepting subscriptions, your subscribers will no longer
be able to access the APIs. 

**Subscribers will be refunded the active monthly fee of their current
billing period.**

If you simply need to stop accepting new subscriptions, consider using
[`fastcharge app update --make-private`](./update) instead. This way, existing
subscribers are not affected.

## Usage

```bash
fastcharge app delete [APP_NAME]
```


## Arguments:

### APP_NAME

Type: string. Required.

Name of the app to be deleted.
