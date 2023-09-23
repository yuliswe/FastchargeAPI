import { UserAppToken } from "@/database/models/UserAppToken";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { RequestContext } from "../RequestContext";
import { getParameterFromAWSSystemsManager } from "./aws";

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
    const { token, signature } = await makeAppTokenForUser(context, {
        user,
        app,
    });
    const userAppToken = await context.batched.UserAppToken.create({
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
    const privateKey = await getParameterFromAWSSystemsManager("auth.user_app_token.private_key");
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
