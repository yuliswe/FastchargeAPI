import { describe, expect, test } from "@jest/globals";
import { RequestContext, createDefaultContextBatched } from "../RequestContext";
import { GatewayMode, User } from "../dynamoose/models";
import { appResolvers } from "../resolvers/app";
import { UserPK } from "../pks/UserPK";
import { v4 as uuidv4 } from "uuid";
import { getOrCreateTestUser } from "./test-utils";
import { GQLAppVisibility } from "../__generated__/resolvers-types";

const context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: false,
    isSQSMessage: false,
    isAnonymousUser: false,
    isAdminUser: false,
};
// jest.retryTimes(2);
describe("APP API", () => {
    const testUserEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    const testAppName = `testapp-${uuidv4()}`;
    let testUser: User;

    test("Preparation: get test user 1 (as app owner)", async () => {
        testUser = await getOrCreateTestUser(context, { email: testUserEmail });
    });

    test("create an App", async () => {
        const app = await appResolvers.Mutation?.createApp?.(
            {},
            {
                name: testAppName,
                title: "Test App",
                description: "TestApp Description",
                owner: UserPK.stringify(testUser),
                homepage: "https://fastchargeapi.com",
                repository: "",
                gatewayMode: GatewayMode.proxy,
                visibility: GQLAppVisibility.Public,
            },
            context,
            {} as never
        );
        expect(app).not.toBe(null);
        expect(app?.name).toBe(testAppName);
        expect(app?.description).toBe("TestApp Description");
        expect(app?.owner).toBe(UserPK.stringify(testUser));
        expect(app?.homepage).toBe("https://fastchargeapi.com");
        expect(app?.repository).toBe("");
        expect(app?.gatewayMode).toBe(GatewayMode.proxy);
    });
});
