import { User } from "@/database/models/User";
import jwt from "jsonwebtoken";
import { MD5 } from "object-hash";
import { v4 as uuidv4 } from "uuid";
import { RequestContext } from "../RequestContext";
import { UserPK } from "../pks/UserPK";
import { getParameterFromAWSSystemsManager } from "./aws";

export async function getUserByPK(context: RequestContext, pk: string) {
  return context.batched.User.get(UserPK.parse(pk));
}

function createUserIDFromEmail(email: string): string {
  return MD5(email);
}

export async function createUserWithEmail(
  batched: RequestContext["batched"],
  email: string,
  additionalProps?: Partial<User>
): Promise<User> {
  const user = await batched.User.create({
    ...additionalProps,
    uid: createUserIDFromEmail(email),
    email: email,
  });
  return user;
}

export async function makeFastchargeAPIIdTokenForUser({
  user,
  expireInSeconds,
}: {
  user: User;
  expireInSeconds: number;
}): Promise<string> {
  const privateKey = await getParameterFromAWSSystemsManager("auth.fastchargeapi_signing.private_key");
  if (!privateKey) {
    throw new Error("Failed to get private key from AWS Systems Manager");
  }
  const idtoken = jwt.sign(
    {
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000 + expireInSeconds),
      aud: "fastchargeapi.com",
      iss: "fastchargeapi.com",
      sub: UserPK.stringify(user),
      userPK: UserPK.stringify(user),
      email: user.email,
      jwtid: uuidv4().toString(),
    },
    privateKey,
    {
      algorithm: "ES256",
    }
  );
  return idtoken;
}
