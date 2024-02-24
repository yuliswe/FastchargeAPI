import { Currency, StripePaymentAcceptStatus } from "@/src/__generated__/gql/graphql";
import { tableConfigs } from "@/src/database/dynamodb";
import { PK, String_Required_NotEmpty, defaultCreatedAt, validateStringDecimal } from "@/src/database/utils";
import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";

/**
 * StripePaymentAccept represents an event when the user successfully pays over
 * the Stripe checkout session. StripePaymentAccept corresponds to an
 * AccountActivity which is created when the StripePaymentAccept object settles.
 * The The object is created by the payment-servce when it receives the webhook
 * event from Stripe.
 */
export class StripePaymentAccept extends Item {
  user: PK;
  amount: string;
  createdAt: number;
  updatedAt: number;
  currency: Currency;
  status: StripePaymentAcceptStatus;
  stripePaymentStatus: string; // This is copied from stripe checkout session's payment_status, for debugging purpose
  stripeSessionObject: object; // The entire stripe checkout session object, for debugging purpose
  stripePaymentIntent: string; // The stripe payment intent ID, copied from stripe checkout session's payment_intent
  stripeSessionId: string; // The stripe checkout session ID, copied from stripe checkout session object for debugging purpose
  accountActivity: PK; // When the stripe payment is accepted, an account activity item is created
}

export type StripePaymentAcceptCreateProps = {
  user: PK;
  stripeSessionId: string;
  amount: string;
  stripePaymentStatus: string;
  stripePaymentIntent: string;
  stripeSessionObject: object;
} & Partial<StripePaymentAccept>;

export const StripePaymentAcceptTableSchema = new dynamoose.Schema(
  {
    user: { type: String, hashKey: true, required: true },
    createdAt: { type: Number, rangeKey: true, default: defaultCreatedAt },
    stripeSessionId: { type: String, required: true },
    amount: {
      type: String,
      required: true,
      validate: validateStringDecimal("amount"),
    },
    currency: { type: String, required: false, default: "usd" },
    // @stripePaymentStatus: Do not check enum, as the source is stripe and
    // can change. Read the comment of the stripePaymentStatus field in the
    // StripePaymentAcceptTableSchema
    stripePaymentStatus: { ...String_Required_NotEmpty("status") },
    stripePaymentIntent: {
      ...String_Required_NotEmpty("stripePaymentIntent"),
    },
    stripeSessionObject: { type: Object, required: true },
    accountActivity: { type: String, required: false },
    status: {
      type: String,
      enum: Object.values(StripePaymentAcceptStatus),
      required: false,
      default: StripePaymentAcceptStatus.Pending,
    },
  },
  {
    timestamps: {
      updatedAt: {
        updatedAt: {
          type: Number,
        },
      },
    },
  }
);

export const StripePaymentAcceptModel = dynamoose.model<StripePaymentAccept>(
  "StripePaymentAccept",
  StripePaymentAcceptTableSchema,
  { ...tableConfigs }
);
