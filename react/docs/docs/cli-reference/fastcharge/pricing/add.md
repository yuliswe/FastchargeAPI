---
sidebar_label: add
---

# fastcharge pricing add

Add a new pricing plan to your app.

## Usage

```bash
fastcharge pricing add [APP_NAME] [OPTIONS]
```

## Arguments:

APP_NAME

Type: string. Required.

The name of the app to which the pricing is added.

## Available options:

### --name STRING

Type: string. Required.

Specify a name for the pricing plan. For examples, "Free", "Advanced" or "Premium".

```bash
--name "Free"
```

### --monthly-charge, -m FLOAT

Type: float. Required.

Set a monthly charge in USD for this subscription plan. 

#### Example

To charge a $10.50 monthly fee:

```bash
--monthly-charge 10.5
```


### --charge-per-request, -m FLOAT

Type: float. Required.

Set a per-request charge in USD for this subscription plan.

```bash
--charge-per-request 0.001
```


### --free-quota, -m INT

Type: int. Required.

Set the number of requests that users can make without paying.

```bash
--free-quota 100
```


### --call-to-action STRING

Type: string. Optional.

Set promotional text to advertise this pricing plan. This is typically displayed
on the app's page in the pricing section.

```bash
--call-to-action "Enjoy fast and stable API"
```

### --make-visible / --make-invisible

An alias to `--visible true` / `false`.

### --visible BOOLEAN

Type: boolean. Optional. Default: `false`.

Set the visibility of the pricing. Setting the property to `false` allows you to
pause new subscriptions of a plan without affecting existing subscribers.


