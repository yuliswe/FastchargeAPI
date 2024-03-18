import { User } from "@/src/database/entities/User";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { createConnection, type Connection } from "@typedorm/core";
import { DocumentClientV3 } from "@typedorm/document-client";
import { inspect } from "util";

const documentClient = new DocumentClientV3(
  new DynamoDBClient({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    logger: {
      ...console,
      info(...args: unknown[]) {
        const messages = args.splice(0, args.length - 1);
        const last = args[args.length - 1];
        console.log(...messages, inspect(last, { depth: null }));
      },
    },
  })
);

let existingConnection: Connection | undefined;
export function createTypedormConnection() {
  if (!existingConnection) {
    existingConnection = createConnection({
      entities: [User],
      documentClient,
    });
  }
}
