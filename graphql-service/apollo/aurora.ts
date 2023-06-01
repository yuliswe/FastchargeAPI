import { ExecuteStatementCommand, RDSDataClient } from "@aws-sdk/client-rds-data";

export const auroraResourceArn = "arn:aws:rds:us-east-1:887279901853:cluster:fastcharge-search-cluster";
export const auroraSecretArn =
    "arn:aws:secretsmanager:us-east-1:887279901853:secret:AuroraDBSecret-ie6utwL7NgUH-7TUv3G";
export const rdsClient = new RDSDataClient({});

export async function wakeUpAurora() {
    const command = new ExecuteStatementCommand({
        resourceArn: auroraResourceArn,
        secretArn: auroraSecretArn,
        sql: `select 1;`,
    });
    await rdsClient.send(command);
}
