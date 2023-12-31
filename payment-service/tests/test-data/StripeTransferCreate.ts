import Stripe from "stripe";

export function getTestStripeTransferCreateResponse(): Stripe.Response<Stripe.Transfer> {
  return {
    id: "tr_1MiN3gLkdIwHu7ixNCZvFdgA",
    object: "transfer",
    amount: 400,
    amount_reversed: 0,
    balance_transaction: "txn_1MiN3gLkdIwHu7ixxapQrznl",
    created: 1678043844,
    currency: "usd",
    description: null,
    destination: "acct_1MTfjCQ9PRzxEwkZ",
    destination_payment: "py_1MiN3gQ9PRzxEwkZWTPGNq9o",
    livemode: false,
    metadata: {},
    reversals: {
      object: "list",
      data: [],
      has_more: false,
      url: "/v1/transfers/tr_1MiN3gLkdIwHu7ixNCZvFdgA/reversals",
    },
    reversed: false,
    source_transaction: null,
    source_type: "card",
    transfer_group: "ORDER_95",
    lastResponse: {
      headers: {},
      requestId: "req_1MiN3gQ9PRzxEwkZ7Qs3H8Zc",
      statusCode: 200,
    },
  };
}
