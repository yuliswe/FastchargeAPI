import { describe, expect, test } from "@jest/globals";
import { RequestContext, createDefaultContextBatched } from "../RequestContext";
import { AlreadyExists } from "../errors";
import { GatewayMode, StripePaymentAccept, User } from "../dynamoose/models";
import { stripePaymentAcceptResolvers } from "../resolvers/payment";
import { getUserBalance } from "../functions/account";
import Decimal from "decimal.js-light";
import { appResolvers } from "../resolvers/app";

let context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: false,
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
                console.log("User already exists");
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
                name: "Test App",
            });
        } catch (e) {
            //
        }
        let app = await appResolvers.Mutation?.createApp?.(
            {},
            {
                name: "Test App",
                description: "Test App Description",
                owner: user.email,
                homepage: "https://fastchargeapi.com",
                repository: "",
                gatewayMode: GatewayMode.proxy,
            },
            context,
            {} as any
        );
        expect(app).not.toBe(null);
        expect(app?.name).toBe("Test App");
        expect(app?.description).toBe("Test App Description");
        expect(app?.owner).toBe(user.email);
        expect(app?.homepage).toBe("https://fastchargeapi.com");
        expect(app?.repository).toBe("");
        expect(app?.gatewayMode).toBe(GatewayMode.proxy);
    });
});
