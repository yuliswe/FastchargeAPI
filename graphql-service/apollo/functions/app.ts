import { App } from "@/database/models/App";
import { ValidationError } from "@/errors";
import { BatchExecuteStatementCommand, ExecuteStatementCommand } from "@aws-sdk/client-rds-data";
import { RequestContext } from "../RequestContext";
import { GQLAppFullTextSearchOrderBy } from "../__generated__/resolvers-types";
import { auroraResourceArn, auroraSecretArn, rdsClient } from "../database/aurora";
import { AppPK } from "../pks/AppPK";
import { settlePromisesInBatches } from "./promise";

export async function getAppByPK(context: RequestContext, pk: string): Promise<App> {
    return context.batched.App.get(AppPK.parse(pk));
}

export function validateAppName(name: unknown): boolean {
    if (typeof name !== "string") {
        throw new ValidationError("name", "must be a string", name);
    }
    if (!/^[a-z\d][a-z\d\\-]*[a-z\d]$/.test(name)) {
        throw new ValidationError("name", "can only contain lowercase letters, numbers, and dashes", name);
    }
    const reserved = ["api", "login", "auth"];
    if (reserved.includes(name)) {
        throw new ValidationError("name", "is a reserved name", name);
    }
    if (name.length > 63) {
        throw new ValidationError("name", "cannot be more than 63 characters", name);
    }
    return true;
}

export async function updateAppSearchIndex(context: RequestContext, apps: App[]): Promise<number> {
    const tags = apps.map((app) => context.batched.AppTag.many({ app: AppPK.stringify(app) }));
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
        secretArn: await auroraSecretArn(),
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
        secretArn: await auroraSecretArn(),
        sql: `select name from trigm_search_app(:search_text, :tag, :orderBy, :limit, :offset, :similarity)`,
        parameters,
    });
    const response = await rdsClient.send(command, {
        requestTimeout: 60_000,
    });
    const results: App[] = [];
    await settlePromisesInBatches(
        response.records ?? [],
        async (record) => {
            const app_name = record[0].stringValue;
            results.push(...(await context.batched.App.many({ name: app_name })));
        },
        { batchSize: 10 }
    );
    return results;
}
