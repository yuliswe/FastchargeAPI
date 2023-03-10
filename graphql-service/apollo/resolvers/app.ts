import { GraphQLResolveInfo } from "graphql";
import {
    App,
    GatewayMode,
} from "../dynamoose/models";
import { Denied } from "../errors";
import { Can } from "../permissions";
import { RequestContext } from "../RequestContext";
import {
    GQLAppUpdateAppArgs,
    GQLMutationCreateAppArgs,
    GQLQueryAppArgs,
    GQLQueryAppFullTextSearchArgs,
    GQLResolvers,
} from "../__generated__/resolvers-types";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import AWS from "aws-sdk";
import {
    PRIVATE_KEY_PARAM_NAME,
    USER_APP_TOKEN_EXPIRATION,
    USER_APP_TOKEN_HASH_ALGORITHM,
    USER_APP_TOKEN_ISSUER,
} from "./constants";

export const appResolvers: GQLResolvers = {
    App: {
        async name(parent, args, context, info) {
            let app = await context.batched.App.get(parent.name);
            return app.name;
        },
        async endpoints(parent, args, context) {
            let endpoints = await context.batched.Endpoint.many({
                app: parent.name,
            });
            return endpoints;
        },
        gatewayMode: (parent) => parent.gatewayMode || GatewayMode.proxy,
        async owner(parent, args, context, info) {
            let user = await context.batched.User.get(parent.owner);
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
        async description(parent, args, context, info) {
            let app = await context.batched.App.get(parent.name);
            return app.description || "";
        },
        ownedByYou: (parent, args, { currentUser }) =>
            parent.owner === currentUser,
        async updateApp(
            { name }: App,
            args: GQLAppUpdateAppArgs,
            context: RequestContext,
            info: GraphQLResolveInfo
        ): Promise<App> {
            let app = await context.batched.App.get(name);
            if (!(await Can.updateApp(app, context))) {
                throw new Denied();
            }
            return await context.batched.App.update({ name }, args);
        },
        async deleteApp(parent, args: never, context, info) {
            if (!(await Can.deleteApp(parent, context))) {
                throw new Denied();
            }
            await context.batched.App.delete(parent.name);
            return parent;
        },
        async createAppUserToken(
            parent: App,
            args: never,
            context,
            info
        ): Promise<string> {
            if (!(await Can.createAppUserToken(parent, context))) {
                throw new Denied();
            }
            const appName = parent.name;
            const currentUserEmail = context.currentUser;
            const privateKey = await getParameterFromAWSSystemsManager(
                PRIVATE_KEY_PARAM_NAME
            );
            if (!privateKey || !currentUserEmail) {
                throw new Denied();
            }
            const tokenJTI = uuidv4().toString();
            const newAppToken = jwt.sign(
                {
                    app: appName,
                    iat: Math.floor(Date.now() / 1000),
                    email: currentUserEmail,
                },
                privateKey,
                {
                    algorithm: USER_APP_TOKEN_HASH_ALGORITHM,
                    expiresIn: USER_APP_TOKEN_EXPIRATION,
                    issuer: USER_APP_TOKEN_ISSUER,
                    jwtid: tokenJTI,
                }
            );
            let currentUserAppTokens = (
                await context.batched.User.getOrNull(currentUserEmail)
            )?.appTokens;
            if (!currentUserAppTokens) {
                currentUserAppTokens = {};
            }
            currentUserAppTokens[appName] = tokenJTI;
            await context.batched.User.update(
                { email: currentUserEmail },
                { appTokens: currentUserAppTokens }
            );
            return newAppToken;
        },
        async revokeAppUserToken(
            parent: App,
            args: never,
            context,
            info
        ): Promise<boolean> {
            if (!(await Can.revokeAppUserToken(parent, context))) {
                throw new Denied();
            }
            const appName = parent.name;
            const currentUserEmail = context.currentUser;
            if (!currentUserEmail) {
                throw new Denied();
            }
            let currentUserAppTokens = (
                await context.batched.User.getOrNull(currentUserEmail)
            )?.appTokens;
            if (!currentUserAppTokens || !currentUserAppTokens[appName]) {
                return false;
            }
            delete currentUserAppTokens[appName];
            await context.batched.User.update(
                { email: currentUserEmail },
                { appTokens: currentUserAppTokens }
            );
            return true;
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
            let apps = await context.batched.App.substringSearch(query, [
                "name",
                "description",
            ]);
            let visableApps = await Can.viewAppFilter(apps, context);
            return visableApps;
        },
    },
    Mutation: {
        async createApp(
            parent: {},
            {
                description,
                gatewayMode,
                homepage,
                name,
                owner,
                repository,
            }: GQLMutationCreateAppArgs,
            context: RequestContext
        ): Promise<App> {
            if (!(await Can.createApp({ owner }, context))) {
                throw new Denied();
            }
            return await context.batched.App.create({
                description,
                gatewayMode,
                homepage,
                name,
                owner,
                repository,
            });
        },
    },
};

async function getParameterFromAWSSystemsManager(
    parameterName: string
): Promise<string | undefined> {
    try {
        const params: AWS.SSM.GetParameterRequest = {
            Name: parameterName,
            WithDecryption: true,
        };

        const ssm = new AWS.SSM({ region: "us-east-1" });
        const data = await ssm.getParameter(params).promise();
        return data.Parameter?.Value;
    } catch (err) {
        console.error(`Failed to get parameter from cloud`, err);
    }
}
