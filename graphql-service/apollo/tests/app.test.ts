import { describe, expect, test } from "@jest/globals";
import { RequestContext, createDefaultContextBatched } from "../RequestContext";
import { AlreadyExists } from "../errors";
import { GatewayMode, User } from "../dynamoose/models";
import { appResolvers } from "../resolvers/app";
import { createUserWithEmail } from "../functions/user";
import { GQLUserIndex } from "../__generated__/resolvers-types";
import { UserPK } from "../pks/UserPK";

let context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: false,
    isSQSMessage: false,
    isAnonymousUser: false,
};
// jest.retryTimes(2);
describe("APP API", () => {
    let user: User;
    test("create a User (app owner)", async () => {
        try {
            user = await createUserWithEmail(context, "testuser1.fastchargeapi@gmail.com");
        } catch (e) {
            if (e instanceof AlreadyExists) {
                user = await context.batched.User.get(
                    { email: "testuser1.fastchargeapi@gmail.com" },
                    { using: GQLUserIndex.IndexByEmailOnlyPk }
                );
            } else {
                throw e;
            }
        }
        expect(user).not.toBe(null);
    });

    test("create an App", async () => {
        // delete the app if it already exists
        try {
            await context.batched.App.delete({
                name: "test-app",
            });
        } catch (e) {
            //
        }
        let app = await appResolvers.Mutation?.createApp?.(
            {},
            {
                name: "test-app",
                title: "Test App",
                description: "TestApp Description",
                owner: UserPK.stringify(user),
                homepage: "https://fastchargeapi.com",
                repository: "",
                gatewayMode: GatewayMode.proxy,
            },
            context,
            {} as never
        );
        expect(app).not.toBe(null);
        expect(app?.name).toBe("test-app");
        expect(app?.description).toBe("TestApp Description");
        expect(app?.owner).toBe(UserPK.stringify(user));
        expect(app?.homepage).toBe("https://fastchargeapi.com");
        expect(app?.repository).toBe("");
        expect(app?.gatewayMode).toBe(GatewayMode.proxy);
    });
});
