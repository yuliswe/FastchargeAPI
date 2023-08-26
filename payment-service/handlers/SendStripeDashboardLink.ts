import { createDefaultContextBatched } from "@/RequestContext";
import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { SES } from "aws-sdk";
import { Chalk } from "chalk";
import Stripe from "stripe";
import { LambdaEventV2, LambdaHandlerV2, getCurrentUserFromEvent } from "../utils/LambdaContext";
import { getStripeClient } from "../utils/stripe-client";

const chalk = new Chalk({ level: 3 });
const ses = new SES({ region: "us-east-1" });
const batched = createDefaultContextBatched();

/**
 * @returns
 */
async function handle(event: LambdaEventV2): Promise<APIGatewayProxyStructuredResultV2> {
    const stripeClient = await getStripeClient();

    const user = await getCurrentUserFromEvent(event);
    if (!user.stripeConnectAccountId) {
        throw new Error("User stripeConnectAccountId not found");
    }
    let link;
    try {
        link = await stripeClient.accounts.createLoginLink(user.stripeConnectAccountId);
    } catch (e) {
        if (e instanceof Stripe.errors.StripeInvalidRequestError) {
            await sendOnboardingEmail({ email: user.email });
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Bad Request" }),
                isBase64Encoded: false,
            };
        }
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),
            isBase64Encoded: false,
        };
    }
    await sendEmail({ email: user.email, link: link.url });
    return {
        statusCode: 200,
        body: JSON.stringify({}),
        isBase64Encoded: false,
    };
}

async function sendEmail({ email, link }: { email: string; link: string }) {
    console.log(chalk.yellow(`Sending email to ${email}`));
    await ses
        .sendEmail({
            Destination: {
                ToAddresses: [email],
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: `${link}`,
                    },
                    Text: {
                        Charset: "UTF-8",
                        Data: `${link}`,
                    },
                },
                Subject: {
                    Charset: "UTF-8",
                    Data: `Sign-in Link to Your FastchargeAPI Dashboard (Stripe)`,
                },
            },
            Source: "FastchargeAPI <no-reply@fastchargeapi.com>",
        })
        .promise();
}

async function sendOnboardingEmail({ email }: { email: string }) {
    console.log(chalk.yellow(`Sending onboarding email to ${email}`));
    const link = "https://fastchargeapi.com/onboard";
    await ses
        .sendEmail({
            Destination: {
                ToAddresses: [email],
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: `${link}`,
                    },
                    Text: {
                        Charset: "UTF-8",
                        Data: `${link}`,
                    },
                },
                Subject: {
                    Charset: "UTF-8",
                    Data: `Set Up Your FastchargeAPI Account with Stripe`,
                },
            },
            Source: "FastchargeAPI <no-reply@fastchargeapi.com>",
        })
        .promise();
}

export const lambdaHandler: LambdaHandlerV2 = async (
    event,
    context,
    callback
): Promise<APIGatewayProxyStructuredResultV2> => {
    try {
        console.log(chalk.blue(JSON.stringify(event)));
        return await handle(event);
    } catch (error) {
        try {
            console.error(error);
            console.error(chalk.red(JSON.stringify(error)));
        } catch (jsonError) {
            console.log(error);
        }
        return {
            statusCode: 500,
            body: "Internal Server Error",
            isBase64Encoded: false,
        };
    }
};
