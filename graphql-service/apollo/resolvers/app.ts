import { Chalk } from "chalk";
import { GraphQLResolveInfo } from "graphql";
import { RequestContext } from "../RequestContext";
import {
    GQLAppResolvers,
    GQLAppUpdateAppArgs,
    GQLMutationCreateAppArgs,
    GQLQueryAppArgs,
    GQLQueryAppFullTextSearchArgs,
    GQLResolvers,
} from "../__generated__/resolvers-types";
import { App } from "../dynamoose/models";
import { BadInput, Denied, TooManyResources } from "../errors";
import { appFullTextSearch, flushAppSearchIndex, isValidAppName } from "../functions/app";
import { Can } from "../permissions";
import { AppPK } from "../pks/AppPK";
import { UserPK } from "../pks/UserPK";

const chalk = new Chalk({ level: 3 });

export const appResolvers: GQLResolvers & {
    App: GQLAppResolvers;
} = {
    App: {
        /**************************
         * All public attributes
         **************************/
        pk: (parent) => AppPK.stringify(parent),
        name: (parent) => parent.name,
        title: (parent) => parent.title,
        createdAt: (parent) => parent.createdAt,
        updatedAt: (parent) => parent.updatedAt,
        description: (parent) => parent.description,
        repository: (parent) => parent.repository,
        homepage: (parent) => parent.homepage,
        readme: (parent) => parent.readme,
        gatewayMode: (parent) => parent.gatewayMode,
        async owner(parent, args, context, info) {
            let user = await context.batched.User.get(UserPK.parse(parent.owner));
            return user;
        },
        async pricingPlans(parent: App, args: {}, context: RequestContext) {
            if (await Can.viewAppHiddenPricingPlans(parent, context)) {
                return await context.batched.Pricing.many({
                    app: parent.name,
                });
            } else {
                return await context.batched.Pricing.many({
                    app: parent.name,
                    visible: true,
                });
            }
        },
        async endpoints(parent, args, context) {
            let endpoints = await context.batched.Endpoint.many({
                app: parent.name,
            });
            return endpoints;
        },
        async updateApp(
            parent: App,
            { title, description, homepage, repository, readme, visibility }: GQLAppUpdateAppArgs,
            context: RequestContext,
            info: GraphQLResolveInfo
        ): Promise<App> {
            if (!(await Can.updateApp(parent, { title, description, homepage, repository }, context))) {
                throw new Denied();
            }
            return await context.batched.App.update(parent, {
                title,
                description,
                homepage,
                repository,
                readme,
                visibility,
            });
        },
        async deleteApp(parent: App, args: never, context: RequestContext): Promise<App> {
            if (!(await Can.deleteApp(parent, context))) {
                throw new Denied();
            }
            await context.batched.App.delete(parent.name);
            return parent;
        },

        /**************************
         * All private attributes
         **************************/
    },
    Query: {
        // async apps(
        //     parent: {},
        //     args: GQLQueryAppArgs,
        //     context: RequestContext,
        //     info: GraphQLResolveInfo
        // ): Promise<Array<App>> {
        //     let apps = await context.batched.App.scan();
        //     let visableApps = await Can.viewAppFilter(apps, context);
        //     return visableApps;
        // },
        async app(parent: {}, { pk, name }: GQLQueryAppArgs, context: RequestContext): Promise<App> {
            if (!pk && !name) {
                throw new BadInput("Must provide either pk or name");
            }
            let app: App;
            if (pk) {
                app = await context.batched.App.get(AppPK.parse(pk));
            } else if (name) {
                app = await context.batched.App.get({ name });
            }
            return app!;
        },

        async appFullTextSearch(
            parent: {},
            { query, limit, offset }: GQLQueryAppFullTextSearchArgs,
            context: RequestContext
        ): Promise<Array<App>> {
            return await appFullTextSearch(context, { query, limit: limit || undefined, offset: offset || undefined });
        },
    },
    Mutation: {
        async createApp(
            parent: {},
            {
                owner,
                name,
                title,
                description,
                gatewayMode,
                homepage,
                repository,
                visibility,
            }: GQLMutationCreateAppArgs,
            context: RequestContext
        ): Promise<App> {
            if (!(await Can.createApp({ owner }, context))) {
                throw new Denied();
            }
            if (!isValidAppName(name)) {
                if (name.length > 63) {
                    throw new BadInput(`Invalid app name: ${name}. At most 63 characters.`, "APP_NAME");
                }
                throw new BadInput(
                    `Invalid app name: ${name}. Must match: /^[a-z\\d][a-z\\d\\-]*[a-z\\d]$/.`,
                    "APP_NAME"
                );
            }
            // Each user can have at most 10 apps
            let count = await context.batched.App.count({ owner });
            if (count >= 10) {
                throw new TooManyResources("You can only have 10 apps");
            }
            return await context.batched.App.create({
                name,
                title,
                description,
                gatewayMode,
                homepage,
                owner,
                repository,
                visibility,
            });
        },

        async flushAppSearchIndex(parent: {}, args: {}, context: RequestContext) {
            if (!(await Can.flushAppSearchIndex(context))) {
                throw new Denied();
            }
            return await flushAppSearchIndex(context);
        },
    },
};
