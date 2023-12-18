import { ExecuteStatementCommand, RDSDataClient } from "@aws-sdk/client-rds-data";
import { ListSecretsCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

export const auroraResourceArn =
  process.env.DEV_DOMAIN === "1"
    ? "arn:aws:rds:us-east-1:209991057786:cluster:dev-search-service-auroradbcluster"
    : "arn:aws:rds:us-east-1:887279901853:cluster:live-search-service-auroradbcluster";

export const secretsManager = new SecretsManagerClient({});
export const rdsClient = new RDSDataClient({});

async function getSecretArnFromName(name: string): Promise<string | undefined> {
  const secret = await secretsManager.send(
    new ListSecretsCommand({
      IncludePlannedDeletion: false,
      Filters: [
        {
          Key: "name",
          Values: [name],
        },
      ],
      MaxResults: 1,
    })
  );
  return secret.SecretList?.[0]?.ARN;
}

let _auroraSecretArn: string | undefined;
export async function auroraSecretArn(): Promise<string> {
  if (_auroraSecretArn) {
    return _auroraSecretArn;
  }
  let secretName;
  if (process.env.DEV_DOMAIN === "1") {
    secretName = "dev-search-service-AuroraDBSecret";
  } else {
    secretName = "live-search-service-AuroraDBSecret";
  }
  _auroraSecretArn = await getSecretArnFromName(secretName);
  if (!_auroraSecretArn) {
    throw new Error("Could not find Aurora secret: " + secretName);
  }
  return _auroraSecretArn;
}

export async function wakeUpAurora() {
  const command = new ExecuteStatementCommand({
    resourceArn: auroraResourceArn,
    secretArn: await auroraSecretArn(),
    sql: `select 1;`,
  });
  await rdsClient.send(command);
}
