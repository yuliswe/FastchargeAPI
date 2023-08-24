import { LambdaEventV2 } from "utils/LambdaContext";

export function makeGetStripeCheckoutLinkLambdaEvent({
    userPK,
    body,
}: {
    userPK: string;
    body: string;
}): LambdaEventV2 {
    return {
        version: "2.0",
        routeKey: "POST /accept-payment",
        rawPath: "/accept-payment",
        rawQueryString: "",
        queryStringParameters: {},
        headers: {
            accept: "*/*; q=0.5, application/xml",
            "accept-encoding": "gzip",
            "cache-control": "no-cache",
            "content-length": "3513",
            "content-type": "application/json; charset=utf-8",
            host: "api.v2.payment.fastchargeapi.com",
            "stripe-signature":
                "t=1678780438,v1=fb6de4205abb8029c7ab92f14b259189a98786a0a7587edb068e5b4791c927d0,v0=b51edf9067d16b92d1378db7cff793d06e5ceb576b0357caf9b9f6d8890c4609",
            "user-agent": "Stripe/1.0 (+https://stripe.com/docs/webhooks)",
            "x-amzn-trace-id": "Root=1-64102816-07688b1e117da0152f43d994",
            "x-forwarded-for": "72.136.80.113",
            "x-forwarded-port": "443",
            "x-forwarded-proto": "https",
        },
        requestContext: {
            accountId: "887279901853",
            apiId: "pngsxpq63k",
            domainName: "api.v2.payment.fastchargeapi.com",
            domainPrefix: "api",
            authorizer: {
                lambda: {
                    userPK,
                },
            },
            http: {
                method: "POST",
                path: "/accept-payment",
                protocol: "HTTP/1.1",
                sourceIp: "72.136.80.113",
                userAgent: "Stripe/1.0 (+https://stripe.com/docs/webhooks)",
            },
            requestId: "BwszojTbIAMEVHQ=",
            routeKey: "POST /accept-payment",
            stage: "$default",
            time: "14/Mar/2023:07:53:58 +0000",
            timeEpoch: 1678780438960,
        },
        body,
        isBase64Encoded: false,
    };
}
