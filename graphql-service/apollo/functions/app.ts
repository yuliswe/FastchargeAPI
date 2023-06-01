import { BatchExecuteStatementCommand, ExecuteStatementCommand, RDSDataClient } from "@aws-sdk/client-rds-data";
import { Chalk } from "chalk";
import { RequestContext } from "../RequestContext";
import { GQLAppFullTextSearchOrderBy } from "../__generated__/resolvers-types";
import { App } from "../dynamoose/models";
import { AppPK } from "../pks/AppPK";
import { auroraResourceArn, auroraSecretArn, rdsClient } from "../aurora";

const chalk = new Chalk({ level: 3 });
export async function getAppByPK(context: RequestContext, pk: string): Promise<App> {
    return context.batched.App.get(AppPK.parse(pk));
}

export function isValidAppName(name: string): boolean {
    let reserved = ["api", "login", "auth"];
    return /^[a-z\d][a-z\d\\-]*[a-z\d]$/.test(name) && name.length <= 63 && !reserved.includes(name);
}

export async function updateAppSearchIndex(context: RequestContext, apps: App[]): Promise<number> {
    const tags = apps.map((app) => context.batched.AppTag.many({ app: app.name }));
    const parameterSets = apps.map(async (app, index) => [
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
        {
            name: "tags",
            value: {
                stringValue: (await tags[index]).map((tag) => tag.tag).join(", "),
            },
        },
        {
            name: "github_popularity",
            value: {
                longValue: 0,
            },
        },
    ]);
    const command = new BatchExecuteStatementCommand({
        resourceArn: auroraResourceArn,
        secretArn: auroraSecretArn,
        sql: `select count(*) from update_app(:name, :title, :description, :tags, :github_popularity)`,
        parameterSets: await Promise.all(parameterSets),
    });
    const response = await rdsClient.send(command);
    return response.updateResults?.length ?? 0;
}

export async function flushAppSearchIndex(context: RequestContext): Promise<number> {
    const promises = [];
    for await (const apps of context.batched.App.scan()) {
        promises.push(updateAppSearchIndex(context, apps));
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
        tag,
        orderBy,
        limit = 100,
        offset = 0,
        minSimilarity = 0.3,
    }: {
        query?: string | null;
        orderBy?: GQLAppFullTextSearchOrderBy | null;
        tag?: string | null;
        limit?: number | null;
        offset?: number | null;
        minSimilarity?: number | null;
    }
): Promise<App[]> {
    const parameters = [
        {
            name: "search_text",
            value: query ? { stringValue: query } : { isNull: true },
        },
        {
            name: "tag",
            value: tag ? { stringValue: tag } : { isNull: true },
        },
        {
            name: "orderBy",
            value: {
                stringValue: orderBy ?? GQLAppFullTextSearchOrderBy.ExactMatch,
            },
        },
        {
            name: "limit",
            value: {
                longValue: limit ?? 100,
            },
        },
        {
            name: "offset",
            value: {
                longValue: offset ?? 0,
            },
        },
        {
            name: "similarity",
            value: {
                doubleValue: minSimilarity ?? 0.3,
            },
        },
    ];
    const command = new ExecuteStatementCommand({
        resourceArn: auroraResourceArn,
        secretArn: auroraSecretArn,
        sql: `select name from trigm_search_app(:search_text, :tag, :orderBy, :limit, :offset, :similarity)`,
        parameters,
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
