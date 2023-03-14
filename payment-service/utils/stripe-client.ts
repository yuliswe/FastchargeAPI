import { Stripe } from "stripe";
import { LambdaEventV2 } from "./LambdaContext";
import { getParameterFromAWSSystemsManager } from "graphql-service";

let stripeClient: Stripe | null = null;
export async function getStripeClient() {
    if (stripeClient) {
        return stripeClient;
    }
    const stripeSecretKey = await getParameterFromAWSSystemsManager("payment.stripe_secret_key");
    if (!stripeSecretKey) {
        throw new Error("Missing Stripe secret key");
    }
    stripeClient = new Stripe(stripeSecretKey, { apiVersion: "2022-11-15" });
    return stripeClient;
}

/**
 * Parses and validate the signature of a webhook event received from the
 * Stripe.
 */
export async function parseStripeWebhookEvent(lambdaEvent: LambdaEventV2): Promise<Stripe.Event> {
    let stripeClient = await getStripeClient();
    let signature: string | undefined =
        lambdaEvent.headers["Stripe-Signature"] || lambdaEvent.headers["stripe-signature"];
    if (!signature) {
        throw new Error("Missing Stripe-Signature header");
    }
    if (!lambdaEvent.body) {
        throw new Error("Missing body");
    }

    let stripeEndpointSecret = await getParameterFromAWSSystemsManager("payment.stripe_endpoint_secret");
    if (!stripeEndpointSecret) {
        throw new Error("Missing Stripe endpoint secret");
    }

    let stripeEvent = stripeClient.webhooks.constructEvent(lambdaEvent.body, signature, stripeEndpointSecret);
    return stripeEvent;
}
