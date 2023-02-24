import { GraphQLResolveInfo } from "graphql";
import {
    App,
    AppModel,
    User,
    UserModel,
    GatewayMode,
} from "../dynamoose/models";
import { Denied, NotFound } from "../errors";
import { Can } from "../permissions";
import { RequestContext } from "../RequestContext";
import {
    GQLApp,
    GQLAppResolvers,
    GQLAppUpdateAppArgs,
    GQLMutationCreateAppArgs,
    GQLQueryAppArgs,
    GQLResolvers,
    GQLUser,
    ResolverFn,
    ResolverTypeWrapper,
} from "../__generated__/resolvers-types";
import jwt from "jsonwebtoken";
import { v5 as uuidv5 } from "uuid";
import AWS from 'aws-sdk';
import { PRIVATE_KEY_PARAM_NAME } from "./constants";

// import { toGQLUser } from "./user";

// declare module "../dynamoose/models" {
//     interface App {
//         toGQLApp<T>(context: RequestContext, info: GraphQLResolveInfo): GQLApp
//     }
// }

// AppModel.prototype["toGQLApp"] = function (context: RequestContext): App {
//     return {
//         name: this.name,
//         endpoints: this.endpoints,
//         async owner() {
//             return (await UserModel.get(this.owner)).toGQL<GQLUser>()
//         }
//     }
// }

// export function toGQLApp(app: App): GQLApp {
//     return {
//         name: app.name,
//         endpoints: app.endpoints,
//         owner: app.owner,
//     }
// }

const ssm = new AWS.SSM({ region: 'us-east-1' });

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
        async pricingPlans(parent, args, context, info) {
            return await context.batched.Pricing.many({ app: parent.name });
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
        async createAppUserToken(parent: App, args: never, context, info): Promise<string> {
            if (!(await Can.deleteApp(parent, context))) {
                throw new Denied();
            }
            const appName = parent.name;
            const currentUserEmail = context.currentUser;
            const privateKey = await getParameterFromAWSSystemsManager(PRIVATE_KEY_PARAM_NAME);
            if (!privateKey) {
                throw new Denied();
            }
            const token = jwt.sign(
                { app: appName, iat: Math.floor(Date.now() / 1000), email: currentUserEmail },
                privateKey,
                {
                    algorithm: "ES256",
                    expiresIn: "999999d",
                    issuer: "fastcharge",
                    jwtid: uuidv5.toString(),
                }
            );
            return token;
        },
    },
    Query: {
        async apps(
            parent: never,
            args: GQLQueryAppArgs,
            context: RequestContext,
            info: GraphQLResolveInfo
        ): Promise<Array<App>> {
            let apps = await context.batched.App.scan();
            let visableApps = await Can.viewAppFilter(apps, context);
            return visableApps;
        },
        async app(
            parent: never,
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
    },
    Mutation: {
        async createApp(
            parent: never,
            args: GQLMutationCreateAppArgs,
            context: RequestContext,
            info: GraphQLResolveInfo
        ): Promise<App> {
            if (!(await Can.createApp(args, context))) {
                throw new Denied();
            }
            return await context.batched.App.create(args);
        },
    },
};

async function getParameterFromAWSSystemsManager(parameterName: string): Promise<string | undefined> {
    try {
        const params: AWS.SSM.GetParameterRequest = {
            Name: parameterName,
            WithDecryption: true,
          };
          
          const data = await ssm.getParameter(params).promise();
          console.log(`Got parameter from cloud`, data);
          return data.Parameter?.Value;
    } catch (err) {
      console.error(`Failed to get parameter from cloud`, err);
    }
}