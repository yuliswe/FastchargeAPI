import { describe, expect, test } from "@jest/globals";
import { RequestContext, createDefaultContextBatched } from "../RequestContext";
import { GQLUserIndex } from "../__generated__/resolvers-types";
import { UserPK } from "../pks/UserPK";
import { PricingPK } from "../pks/PricingPK";
import { AlreadyExists } from "../errors";
import { Subscription, User } from "../dynamoose/models";
import { gatewayResolvers } from "../resolvers/gateway";
import { addMoneyForUser } from "./test-utils/account";

let context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: true,
    isSQSMessage: true,
    isAnonymousUser: false,
};
// jest.retryTimes(2);
describe("Gateway API", () => {
    let user: User;
    test("Preparation: get test user 1", async () => {
        user = await context.batched.User.get(
            { email: "testuser1.fastchargeapi@gmail.com" },
            { using: GQLUserIndex.IndexByEmailOnlyPk }
        );
        expect(user).not.toBe(null);
    });

    test("Preparation: create an App", async () => {
        try {
            let app = await context.batched.App.create({
                name: "myapp",
                owner: UserPK.stringify(user),
            });
        } catch (e) {
            if (e instanceof AlreadyExists) {
                console.log("App already exists");
            } else {
                throw e;
            }
        }
    });

    let pricingPK: string;
    test("Preparation: create a Pricing or use existing", async () => {
        let pricingRequirement = {
            app: "myapp",
            name: "Premium",
            minMonthlyCharge: "1",
            chargePerRequest: "0.001",
        };
        let pricing = await context.batched.Pricing.getOrNull(pricingRequirement);
        if (pricing === null) {
            pricing = await context.batched.Pricing.create(pricingRequirement);
        }
        pricingPK = PricingPK.stringify(pricing);
    });

    let subscription: Subscription;
    test("Preparation: subscribe user to this Pricing", async () => {
        let sub = await context.batched.Subscription.getOrNull({
            subscriber: UserPK.stringify(user),
        });
        if (sub === null) {
            subscription = await context.batched.Subscription.create({
                app: "myapp",
                subscriber: UserPK.stringify(user),
                pricing: pricingPK,
            });
        } else {
            subscription = await context.batched.Subscription.update(sub, { pricing: pricingPK });
        }
    });

    test("Prepration: Add monty to the account", async () => {
        await addMoneyForUser(context, { user: UserPK.stringify(user), amount: "10" });
    });

    test("Call checkUserIsAllowedForGatewayRequest", async () => {
        let result = await gatewayResolvers.Query.checkUserIsAllowedForGatewayRequest!(
            {},
            {
                user: UserPK.stringify(user),
                app: "myapp",
                forceBalanceCheck: true,
                forceAwait: true,
            },
            context,
            {} as never
        );
        expect(result.allowed).toBe(true);
        expect(result.userPK).toBe(UserPK.stringify(user));
    });
});
