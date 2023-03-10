import Stripe from "stripe";
export function getStripeClient() {
    return new Stripe(
        "sk_test_51MSgLaB24cItJ1WSPJhxovkHWjbcIcnCVmYlgCpN16acN7HUUlaLWxxcxtJT46hrvA0QHyqwWl1jxH3JeiM7ZTSi0077ZcdUOZ",
        {
            apiVersion: "2022-11-15",
        }
    );
}
