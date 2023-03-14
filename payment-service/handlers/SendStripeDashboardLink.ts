import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createDefaultContextBatched } from "graphql-service";
import { Chalk } from "chalk";
import { getStripeClient } from "../utils/stripe-client";
import { LambdaEventV2, LambdaHandlerV2, getAuthorizerContext } from "../utils/LambdaContext";
import { SES } from "aws-sdk";

const chalk = new Chalk({ level: 3 });
let ses = new SES({ region: "us-east-1" });
const batched = createDefaultContextBatched();

/**
 * @returns
 */
async function handle(event: LambdaEventV2): Promise<APIGatewayProxyStructuredResultV2> {
    const stripeClient = await getStripeClient();

    let userEmail = getAuthorizerContext(event).userEmail;
    if (!userEmail) {
        throw new Error("User email is not set");
    }
    let user = await batched.User.get({ email: userEmail });
    if (!user.stripeConnectAccountId) {
        throw new Error("User stripeConnectAccountId not found");
    }
    let link = await stripeClient.accounts.createLoginLink(user.stripeConnectAccountId);
    await sendEmail({ email: userEmail, link: link.url });
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
                    Data: `Sign-in Link to Your FastChargeAPI Dashboard (Stripe)`,
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
