---
sidebar_label: withdraw
---

# fastcharge account withdraw

Withdraw money from FastchargeAPI to your bank account.

This command sends a withdrawal requests to our payment system and is processed
asynchronously. Upon being processed, your account balance and account
activities will be updated.

:::note
The withdrawal request may take a few seconds to a few minutes to be processed. 
It may take 1-2 business days for the money to arrive at your bank account.
:::

## Usage

```bash
fastcharge account withdraw [AMOUNT_USD]
```

## Arguments

### AMOUNT_USD

Type: float. Required.

Specify the amount to withdraw in USD.

## Example

To withdraw $30.50:

```bash
fastcharge withdraw 30.5
```
