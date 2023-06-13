import { gql } from "@apollo/client";
import { APIGatewayProxyStructuredResultV2, Context as LambdaContext } from "aws-lambda";
import { Chalk } from "chalk";
import Decimal from "decimal.js-light";
import { UserPK, createDefaultContextBatched, getUserBalance, sqsGQLClient } from "graphql-service";
import { RequestContext } from "graphql-service/RequestContext";
import { SQSQueueUrl } from "graphql-service/sqsClient";
import {
    LambdaCallbackV2,
    LambdaEventV2,
    LambdaHandlerV2,
    LambdaResultV2,
    getCurrentUserFromEvent,
} from "../utils/LambdaContext";

const chalk = new Chalk({ level: 3 });

export const context: RequestContext = {
    service: "payment",
    isServiceRequest: true,
    isSQSMessage: false,
    batched: createDefaultContextBatched(),
};

/**
 * Stripe's payout API:
 *  https://stripe.com/docs/connect/add-and-pay-out-guide?integration=with-code#with-code-pay-out-to-user
 *
 * This service is called when the API publisher wants to withdrawl money from
 * their FastchargeAPI accounts to their Stripe account. At this time, the
 * minimum fee charged by Stripe is:
 *
 *   $2 to keep the API publisher's Stripe Express account open 0.25% + $0.25 to
 *   transfer the money to the API publisher's bank account 2.9% + $0.3 when the
 *   API customer tops up their account, which should be paid by the API
 *   publisher. 0.5% to collect taxes
 *
 * The total percentage fee is 3.65%, the total flat fee is $2.55.
 *
 * The workflow is:
 *   1. The API publisher calls this API to withdrawl money from their
 *      FastchargeAPI account.
 *   2. This API checks if the API publisher has enough money in their
 *      FastchargeAPI account, as a sanity check. However, because the API could
 *      be called parallelly, the balance retrieved could be not trusted.
 *   3. This API puts a createStripeTransfer mutation in the GraphQL queue, which
 *      is processed sequentially. The graphql server upon receiving the command,
 *      checks again if the API publisher has enough money in their
 *      FastchargeAPI, and rejects the creation when necessary. This time, the
 *      balance can be trusted, because all billing queue messages are processed
 *      one by one.
 *   4. The graphql server creates a StripeTransfer, and settles immediate to
 *      substract the amount from the API publisher's FastchargeAPI account.
 */
export async function handle(event: LambdaEventV2): Promise<APIGatewayProxyStructuredResultV2> {
    const user = await getCurrentUserFromEvent(event);
    const { bodyData, errorResponse } = parseBody(event);
    if (errorResponse) {
        return errorResponse;
    }
    const withdraw = bodyData!.withdraw;
    const stripeFeePercentage = 3.65 / 100;
    const stripeFlatFee = new Decimal("2.55");
    const totalStripe = stripeFlatFee.add(withdraw.mul(stripeFeePercentage));
    const receivable = withdraw.minus(totalStripe);
    if (receivable.lessThanOrEqualTo(0)) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: `Minimum withdraw is $${totalStripe.toString()}.`,
            }),
        };
    }

    const userAccountBalance = new Decimal(await getUserBalance(context, UserPK.stringify(user)));
    if (userAccountBalance.lessThan(withdraw)) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: `Insufficient balance.`,
            }),
        };
    }

    const billingQueueClient = sqsGQLClient({
        queueUrl: SQSQueueUrl.BillingFifoQueue,
        groupId: UserPK.stringify(user),
        dedupId: `createStripeTransfer-${UserPK.stringify(user)}-${event.requestContext.requestId}`,
    });
    await billingQueueClient.mutate({
        mutation: gql(`
            mutation CreateStripeTransfer(
                $user: ID!
                $withdrawAmount: NonNegativeDecimal!
                $receiveAmount: NonNegativeDecimal!
            ) {
                createStripeTransfer(
                    receiver: $user, 
                    withdrawAmount: $withdrawAmount,
                    receiveAmount: $receiveAmount,
                    currency: "usd",
                ) {
                    settleStripeTransfer {
                        createdAt
                    }
                }
            }
        `),
        variables: {
            user: UserPK.stringify(user),
            withdrawAmount: withdraw.toString(),
            receiveAmount: receivable.toString(),
        },
    });

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Transfer created.",
        }),
    };
}

export const lambdaHandler: LambdaHandlerV2 = async (
    event: LambdaEventV2,
    context: LambdaContext,
    callback: LambdaCallbackV2
): Promise<APIGatewayProxyStructuredResultV2> => {
    try {
        console.log("event", chalk.blue(JSON.stringify(event)));
        return await handle(event);
    } catch (error) {
        try {
            console.error(error);
            console.error(chalk.red(JSON.stringify(error)));
        } catch (jsonError) {
            console.error(error);
        }
        return {
            statusCode: 500,
            body: "Internal Server Error",
        };
    }
};

type BodyData = { withdraw: Decimal };
function parseBody(event: LambdaEventV2): {
    bodyData?: BodyData;
    errorResponse?: LambdaResultV2;
} {
    try {
        let { withdraw: withdrawStr } = JSON.parse(event.body ?? "{}");
        if (!withdrawStr) {
            return {
                errorResponse: {
                    statusCode: 400,
                    body: JSON.stringify({
                        message: "Required: { withdraw: string }",
                    }),
                },
            };
        }
        let withdraw = new Decimal(withdrawStr);
        return { bodyData: { withdraw } };
    } catch (e) {
        return {
            errorResponse: {
                statusCode: 400,
                body: JSON.stringify(e),
            },
        };
    }
}
