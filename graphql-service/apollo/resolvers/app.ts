import { GraphQLResolveInfo } from "graphql";
import { App, GatewayMode } from "../dynamoose/models";
import { BadInput, Denied } from "../errors";
import { Can } from "../permissions";
import { RequestContext } from "../RequestContext";
import {
    GQLAppResolvers,
    GQLAppUpdateAppArgs,
    GQLMutationCreateAppArgs,
    GQLQueryAppArgs,
    GQLQueryAppFullTextSearchArgs,
    GQLResolvers,
} from "../__generated__/resolvers-types";
import { isValidAppName } from "../functions/app";
import { AppPK } from "../pks/AppPK";
import { UserPK } from "../pks/UserPK";

export const appResolvers: GQLResolvers & {
    App: GQLAppResolvers;
} = {
    App: {
        name: (parent) => parent.name,
        title: (parent) => parent.title,
        description: (parent) => parent.description,
        repository: (parent) => parent.repository,
        homepage: (parent) => parent.homepage,
        gatewayMode: (parent) => parent.gatewayMode,
        async endpoints(parent, args, context) {
            let endpoints = await context.batched.Endpoint.many({
                app: parent.name,
            });
            return endpoints;
        },
        async owner(parent, args, context, info) {
            let user = await context.batched.User.get(UserPK.parse(parent.owner));
            if (!(await Can.viewUser(user, context))) {
                throw new Denied();
            }
            return user;
        },
        async pricingPlans(parent: App, args: {}, context: RequestContext) {
            return await context.batched.Pricing.many({
                app: parent.name,
            });
        },
        async updateApp(
            { name }: App,
            { title, description, homepage, repository }: GQLAppUpdateAppArgs,
            context: RequestContext,
            info: GraphQLResolveInfo
        ): Promise<App> {
            let app = await context.batched.App.get(AppPK.parse(name));
            if (!(await Can.updateApp(app, context))) {
                throw new Denied();
            }
            return await context.batched.App.update({ name }, { title, description, homepage, repository });
        },
        async deleteApp(parent, args: never, context, info) {
            if (!(await Can.deleteApp(parent, context))) {
                throw new Denied();
            }
            await context.batched.App.delete(parent.name);
            return parent;
        },
    },
    Query: {
        async apps(
            parent: {},
            args: GQLQueryAppArgs,
            context: RequestContext,
            info: GraphQLResolveInfo
        ): Promise<Array<App>> {
            let apps = await context.batched.App.scan();
            let visableApps = await Can.viewAppFilter(apps, context);
            return visableApps;
        },
        async app(
            parent: {},
            { name }: GQLQueryAppArgs,
            context: RequestContext,
            info: GraphQLResolveInfo
        ): Promise<App> {
            let app = await context.batched.App.get({ name });
            if (!(await Can.viewApp(app, context))) {
                throw new Denied();
            }
            return app;
        },
        async appFullTextSearch(
            parent: {},
            { query }: GQLQueryAppFullTextSearchArgs,
            context: RequestContext,
            info: GraphQLResolveInfo
        ): Promise<Array<App>> {
            let apps = await context.batched.App.substringSearch(query, ["name", "description"]);
            let visableApps = await Can.viewAppFilter(apps, context);
            return visableApps;
        },
    },
    Mutation: {
        async createApp(
            parent: {},
            { owner, name, title, description, gatewayMode, homepage, repository }: GQLMutationCreateAppArgs,
            context: RequestContext
        ): Promise<App> {
            if (!(await Can.createApp({ owner }, context))) {
                throw new Denied();
            }
            if (!isValidAppName(name)) {
                throw new BadInput("Invalid app name: " + name);
            }
            return await context.batched.App.create({
                name,
                title,
                description,
                gatewayMode,
                homepage,
                owner,
                repository,
            });
        },
    },
};
