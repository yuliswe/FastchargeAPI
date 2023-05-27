import { BatchExecuteStatementCommand, ExecuteStatementCommand, RDSDataClient } from "@aws-sdk/client-rds-data";
import { Chalk } from "chalk";
import { RequestContext } from "../RequestContext";
import { App } from "../dynamoose/models";
import { AppPK } from "../pks/AppPK";

const chalk = new Chalk({ level: 3 });
export const auroraResourceArn = "arn:aws:rds:us-east-1:887279901853:cluster:fastcharge-search-cluster";
export const auroraSecretArn =
    "arn:aws:secretsmanager:us-east-1:887279901853:secret:AuroraDBSecret-ie6utwL7NgUH-7TUv3G";
export const rdsClient = new RDSDataClient({});

export async function getAppByPK(context: RequestContext, pk: string): Promise<App> {
    return context.batched.App.get(AppPK.parse(pk));
}

export function isValidAppName(name: string): boolean {
    let reserved = ["api", "login", "auth"];
    return /^[a-z\d][a-z\d\\-]*[a-z\d]$/.test(name) && name.length <= 63 && !reserved.includes(name);
}

export async function updateAppSearchIndex(apps: App[]): Promise<number> {
    const parameterSets = apps.map((app) => [
        {
            name: "name",
            value: {
                stringValue: app.name,
            },
        },
        {
            name: "title",
            value: app.title == undefined ? { isNull: true } : { stringValue: app.title },
        },
        {
            name: "description",
            value: app.description == undefined ? { isNull: true } : { stringValue: app.description },
        },
    ]);
    const command = new BatchExecuteStatementCommand({
        resourceArn: auroraResourceArn,
        secretArn: auroraSecretArn,
        sql: `select count(*) from update_app(:name, :title, :description)`,
        parameterSets,
    });
    const response = await rdsClient.send(command);
    return response.updateResults?.length ?? 0;
}

export async function flushAppSearchIndex(context: RequestContext): Promise<number> {
    const promises = [];
    for await (const apps of context.batched.App.scan()) {
        promises.push(updateAppSearchIndex(apps));
    }
    let count = 0;
    for (const promise of promises) {
        count += await promise;
    }
    return count;
}

export async function appFullTextSearch(
    context: RequestContext,
    {
        query,
        limit = 100,
        offset = 0,
        minSimilarity = 0.3,
    }: { query: string; limit?: number; offset?: number; minSimilarity?: number }
): Promise<App[]> {
    const command = new ExecuteStatementCommand({
        resourceArn: auroraResourceArn,
        secretArn: auroraSecretArn,
        sql: `select name from trigm_search_app(:search_text, :limit, :offset, :similarity)`,
        parameters: [
            {
                name: "search_text",
                value: {
                    stringValue: query,
                },
            },
            {
                name: "limit",
                value: {
                    longValue: limit,
                },
            },
            {
                name: "offset",
                value: {
                    longValue: offset,
                },
            },
            {
                name: "similarity",
                value: {
                    doubleValue: minSimilarity,
                },
            },
        ],
    });
    const response = await rdsClient.send(command, {
        requestTimeout: 60_000,
    });
    const promises = [];
    for (const record of response.records ?? []) {
        const app_name = record[0].stringValue;
        if (app_name) {
            promises.push(context.batched.App.many({ name: app_name }));
        }
    }
    const results = [];
    for (const promise of promises) {
        results.push(...(await promise));
    }
    return results;
}
