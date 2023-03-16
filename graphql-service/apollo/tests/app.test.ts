import { describe, expect, test } from "@jest/globals";
import { RequestContext, createDefaultContextBatched } from "../RequestContext";
import { AlreadyExists } from "../errors";
import { GatewayMode, User } from "../dynamoose/models";
import { appResolvers } from "../resolvers/app";

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
            user = await context.batched.User.create({
                email: "testuser1.fastchargeapi@gmail.com",
            });
        } catch (e) {
            if (e instanceof AlreadyExists) {
                user = await context.batched.User.get({
                    email: "testuser1.fastchargeapi@gmail.com",
                });
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
                owner: user.email,
                homepage: "https://fastchargeapi.com",
                repository: "",
                gatewayMode: GatewayMode.proxy,
            },
            context,
            {} as any
        );
        expect(app).not.toBe(null);
        expect(app?.name).toBe("test-app");
        expect(app?.description).toBe("TestApp Description");
        expect(app?.owner).toBe(user.email);
        expect(app?.homepage).toBe("https://fastchargeapi.com");
        expect(app?.repository).toBe("");
        expect(app?.gatewayMode).toBe(GatewayMode.proxy);
    });
});
