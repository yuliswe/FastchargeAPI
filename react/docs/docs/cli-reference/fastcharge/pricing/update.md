---
sidebar_label: update
---

# fastcharge pricing update

Update attributes of a pricing plan.

## Usage

```bash
fastcharge pricing update [PRICING_ID] [OPTIONS]
```

## Arguments:

### PRICING_ID

Type: string. Optional.

The ID of the pricing plan. The ID can be obtained by running [`fastcharge pricing list`](./list.md).

## Available options:

### --name STRING

Type: string. Optional.

Specify a name for the pricing plan. For examples, "Free", "Advanced" or "Premium".

```bash
--name "Free"
```

### --monthly-charge, -m FLOAT

Type: float. Optional.

Set a monthly charge in USD for this subscription plan. 

#### Example

To charge a $10.50 monthly fee:

```bash
--monthly-charge 10.5
```


### --charge-per-request, -m FLOAT

Type: float. Optional.

Set a per-request charge in USD for this subscription plan.

```bash
--charge-per-request 0.001
```


### --free-quota, -m INT

Type: int. Optional.

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


