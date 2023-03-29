import { RequestContext } from "../RequestContext";
import { PRIVATE_KEY_PARAM_NAME } from "../resolvers/constants";
import { getParameterFromAWSSystemsManager } from "./aws";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { UserAppToken } from "../dynamoose/models";

export async function createUserAppToken(
    context: RequestContext,
    {
        user,
        app,
    }: {
        user: string;
        app: string;
    }
): Promise<{
    userAppToken: UserAppToken;
    token: string;
}> {
    let { token, signature } = await makeAppTokenForUser(context, {
        user,
        app,
    });
    let userAppToken = await context.batched.UserAppToken.create({
        subscriber: user,
        app,
        signature,
    });
    return {
        userAppToken,
        token,
    };
}

async function makeAppTokenForUser(
    context: RequestContext,
    {
        user,
        app,
    }: {
        user: string;
        app: string;
    }
): Promise<{ token: string; signature: string }> {
    const privateKey = await getParameterFromAWSSystemsManager(PRIVATE_KEY_PARAM_NAME);
    if (!privateKey) {
        throw new Error("Failed to get private key from AWS Systems Manager");
    }
    const tokenJTI = uuidv4().toString();
    const newAppToken = jwt.sign(
        {
            app,
            iat: Math.floor(Date.now() / 1000),
            userPK: user,
        },
        privateKey,
        {
            algorithm: "ES256",
            issuer: "fastchargeapi.com",
            jwtid: tokenJTI,
        }
    );
    const signature = newAppToken.split(".")[2];
    return { token: newAppToken, signature };
}
