import { GraphQLResolveInfo } from "graphql";
import { App } from "../dynamoose/models";
import { BadInput, Denied, TooManyResources } from "../errors";
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
        /**************************
         * All public attributes
         **************************/

        name: (parent) => parent.name,
        title: (parent) => parent.title,
        description: (parent) => parent.description,
        repository: (parent) => parent.repository,
        homepage: (parent) => parent.homepage,
        gatewayMode: (parent) => parent.gatewayMode,
        async owner(parent, args, context, info) {
            let user = await context.batched.User.get(UserPK.parse(parent.owner));
            return user;
        },
        async pricingPlans(parent: App, args: {}, context: RequestContext) {
            // If the current user is the app owner, then they can see all pricing plans.
            if (context.currentUser && parent.owner === UserPK.stringify(context.currentUser)) {
                return await context.batched.Pricing.many({
                    app: parent.name,
                });
            } else {
                // Otherwise, only visible pricing plans are returned.
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
            { title, description, homepage, repository }: GQLAppUpdateAppArgs,
            context: RequestContext,
            info: GraphQLResolveInfo
        ): Promise<App> {
            if (!(await Can.updateApp(parent, { title, description, homepage, repository }, context))) {
                throw new Denied();
            }
            return await context.batched.App.update(parent, { title, description, homepage, repository });
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
        async app(parent: {}, { name }: GQLQueryAppArgs, context: RequestContext): Promise<App> {
            let app = await context.batched.App.get({ name });
            return app;
        },
        async appFullTextSearch(
            parent: {},
            { query }: GQLQueryAppFullTextSearchArgs,
            context: RequestContext
        ): Promise<Array<App>> {
            let apps = await context.batched.App.substringSearch(query, ["name", "description"]);
            return apps;
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
                throw new BadInput(`Invalid app name: ${name}. Must match: /^[a-z\\d][a-z\\d\\-]*[a-z\\d]$/.`);
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
            });
        },
    },
};
