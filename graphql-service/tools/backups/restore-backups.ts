import {
    BackupClient,
    ListRecoveryPointsByBackupVaultCommand,
    ListRecoveryPointsByBackupVaultOutput,
    RecoveryPointByBackupVault,
    StartRestoreJobCommand,
} from "@aws-sdk/client-backup";
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { Chalk } from "chalk";
import { program } from "commander";
import readline from "readline";

const chalk = new Chalk({ level: 3 });

const BackupVaultName = "live-dynamodb-backups";
const backupClient = new BackupClient({});
const dynamoDBClient = new DynamoDBClient({});

async function listTables(): Promise<string[]> {
    const tables = await dynamoDBClient.send(new ListTablesCommand({}));
    return (tables.TableNames ?? []).map((t) => t.replace(/^.*_/, "live_"));
}

async function getRestorePoints(backupTime: Date): Promise<RecoveryPointByBackupVault[]> {
    let NextToken = undefined;
    const points = [];
    do {
        const result: ListRecoveryPointsByBackupVaultOutput = await backupClient.send(
            new ListRecoveryPointsByBackupVaultCommand({
                BackupVaultName,
                ByCreatedAfter: backupTime,
                ByCreatedBefore: backupTime,
                NextToken,
            })
        );
        NextToken = result.NextToken;
        points.push(...(result.RecoveryPoints ?? []));
    } while (NextToken);
    return points;
}

async function findRestorePointForEachTable(
    backupTime: Date
): Promise<{ [tableName: string]: RecoveryPointByBackupVault }> {
    const tables = await listTables();
    const points = await getRestorePoints(backupTime);
    const mapping: { [tableName: string]: RecoveryPointByBackupVault } = {};
    for (const table of tables ?? []) {
        const p = points.find((p) => p.ResourceArn?.endsWith(table));
        if (!p) {
            throw new Error(`No restore point found for table ${table}`);
        }
        mapping[table] = p;
    }
    return mapping;
}

type RestoreMap = {
    source: { arn: string; tableName: string };
    dest: { tableName: string };
};
function constructRestoreMap(recoveryPoints: RecoveryPointByBackupVault[]): RestoreMap[] {
    const mapping: RestoreMap[] = [];
    for (const rp of recoveryPoints) {
        if (!rp.ResourceName) {
            console.error("No ResourceName found for recovery point.", rp);
            throw new Error("No ResourceName found for recovery point.");
        }
        mapping.push({
            source: {
                arn: rp.RecoveryPointArn!,
                tableName: rp.ResourceName,
            },
            dest: {
                tableName: `dev_restored_${rp.CreationDate!.getTime()}_${rp.ResourceName}`,
            },
        });
    }
    return mapping;
}

async function startRestore(restoreName: string, restoreMap: RestoreMap[]) {
    for (const { source, dest } of restoreMap) {
        console.log(`Restoring ${source.tableName} to ${dest.tableName}`);
        console.log(source.arn);
        const resp = await backupClient.send(
            new StartRestoreJobCommand({
                RecoveryPointArn: source.arn,
                IdempotencyToken: `${restoreName}_${source.tableName}`,
                IamRoleArn:
                    "arn:aws:iam::209991057786:role/dev-graphql-service-dynam-RestoreFromBackupVaultRo-YUM10F2FLQ81",
                ResourceType: "DynamoDB",
                Metadata: {
                    TargetTableName: dest.tableName,
                },
            })
        );
        console.log(resp);
    }
    console.log(chalk.blue("Restore jobs started. Check AWS Backup console for progress."));
    console.log(chalk.blue("https://us-east-1.console.aws.amazon.com/backup/home?region=us-east-1#/jobs/restore"));
}

program
    .description(`Restore from the ${BackupVaultName} backup vault.`)
    .argument("<BackupTime>", 'Creation time of the backup. eg. "June 5, 2023, 01:00:00"')
    .option(
        "-id, --idempotency-id <IdempotencyId>",
        "A unique name of the restore job. Default to the backup time.",
        undefined
    )
    .action(async (backupTimeString: string, { idempotencyId, ...options }: { idempotencyId?: string }) => {
        const backupDate = new Date(backupTimeString);
        idempotencyId = idempotencyId ?? backupDate.getTime().toString();

        // Test if all tables have a backup. We don't want to miss a table.
        await findRestorePointForEachTable(backupDate);

        // If succeed, then get all restore points (may have more than existing
        // tables) and print summary.
        console.log("Finding restore points for", backupTimeString);
        const recoveryPoints = await getRestorePoints(backupDate);
        console.log(recoveryPoints);
        console.log("Summary:");
        const restoreMap = constructRestoreMap(recoveryPoints);
        for (const { source, dest } of restoreMap) {
            console.log("  ", source.tableName, "~>", chalk.yellow(dest.tableName));
        }
        console.log(`${recoveryPoints.length} recovery points found.`);
        console.log(`IdempotencyId: ${idempotencyId}`);
        console.warn(chalk.yellow("The above backups will be restored. "));
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        const continueAns = await new Promise<string>((resolve) => {
            rl.question("Continue? (y/[N])", resolve);
        });
        rl.close();
        if (continueAns.trim().toLowerCase() !== "y") {
            console.log("Aborted.");
        } else {
            console.log("Continuing...");
            await startRestore(idempotencyId, restoreMap);
        }
    });

program.parse();
