import { SESv2Client } from "@aws-sdk/client-sesv2";
import type { Callback, Context } from "aws-lambda";
import { Chalk } from "chalk";
import { baseDomain } from "graphql-service/runtime-config";
import type { SNSEvent } from "./sns-event-example";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const LambdaForwarder = require("lambda-ses-forwarder");

const chalk = new Chalk({ level: 3 });

const sesClient = new SESv2Client({});

export async function handle(event: SNSEvent, context: Context, callback: Callback<void>): Promise<void> {
    console.log(LambdaForwarder);
    return await LambdaForwarder.handler(event, context, callback, {
        config: {
            fromEmail: `system@${baseDomain}`,
        },
    });
    // for (const Record of event.Records) {
    //     const notification = JSON.parse(Record.body) as SNSEventBody;
    //     const message = JSON.parse(notification.Message) as SNSEventBodyMessage;
    //     await sesClient.send(
    //         new SendEmailCommand({
    //             FromEmailAddress: `system@${baseDomain}`,
    //             Destination: {
    //                 ToAddresses: [process.env.ForwardEmailTo ?? ""],
    //             },
    //             Content: {
    //                 Raw: {
    //                     Data: new TextEncoder().encode(message.content),
    //                 },
    //             },
    //         })
    //     );
    // }
}

export async function lambdaHandler(event: SNSEvent, context: Context, callback: Callback<void>): Promise<void> {
    try {
        console.log("event", chalk.blue(JSON.stringify(event)));
        return await handle(event, context, callback);
    } catch (error) {
        try {
            console.error(error);
            console.error(chalk.red(JSON.stringify(error)));
        } catch (jsonError) {
            console.error(error);
        }
    }
}
