import { ExecuteStatementCommand, RDSDataClient } from "@aws-sdk/client-rds-data";

export const auroraResourceArn =
    process.env.DEV_DOMAIN === "1"
        ? "arn:aws:rds:us-east-1:209991057786:cluster:fastcharge-search-cluster"
        : "arn:aws:rds:us-east-1:887279901853:cluster:fastcharge-search-cluster";
export const auroraSecretArn =
    process.env.DEV_DOMAIN === "1"
        ? "arn:aws:secretsmanager:us-east-1:209991057786:secret:AuroraDBSecret-yDL7gy9eiEwz-d5N6NI"
        : "arn:aws:secretsmanager:us-east-1:887279901853:secret:AuroraDBSecret-ie6utwL7NgUH-7TUv3G";

export const rdsClient = new RDSDataClient({});

export async function wakeUpAurora() {
    const command = new ExecuteStatementCommand({
        resourceArn: auroraResourceArn,
        secretArn: auroraSecretArn,
        sql: `select 1;`,
    });
    await rdsClient.send(command);
}
