import { afterAll, describe, expect, jest, test } from "@jest/globals";
import { RequestContext } from "graphql-service/RequestContext";
import { createDefaultContextBatched } from "graphql-service/RequestContext";
import { getOrCreateTestUser } from "graphql-service/tests/test-utils";
import { spawn } from "child_process";
import path from "path";
import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import { App, User, UserAppToken } from "graphql-service/dynamoose/models";
import { UserPK } from "graphql-service/pks/UserPK";
import { AppPK } from "graphql-service/pks/AppPK";
import { PricingPK } from "graphql-service/pks/PricingPK";
import { createUserAppToken } from "graphql-service/functions/token";
import { Chalk } from "chalk";

const chalk = new Chalk({ level: 3 });

let context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: true,
    isSQSMessage: true,
    isAnonymousUser: false,
};

jest.setTimeout(60_000);

describe("Test CORS requests", () => {
    let sam: SAM | undefined;
    test("Start local SAM", async () => {
        sam = await startLocalSAM();
    });

    test("CORS to / (or any route) should succeed", async () => {
        let resp = await fetch(sam!.url, {
            method: "OPTIONS",
        });
        expect(resp.status).toEqual(200);
        expect(resp.headers.get("Access-Control-Allow-Origin")).toEqual("*");
        expect(resp.headers.get("Access-Control-Allow-Methods")).toEqual("*");
        expect(resp.headers.get("Access-Control-Allow-Headers")).toEqual("*");
    });

    test("CORS to /some/path (or any route) should succeed", async () => {
        let resp = await fetch(sam!.url + "/some/path", {
            method: "OPTIONS",
        });
        expect(resp.status).toEqual(200);
        expect(resp.headers.get("Access-Control-Allow-Origin")).toEqual("*");
        expect(resp.headers.get("Access-Control-Allow-Methods")).toEqual("*");
        expect(resp.headers.get("Access-Control-Allow-Headers")).toEqual("*");
    });

    test("Requests should pass headers with 401", async () => {
        let resp = await fetch(sam!.url, {
            method: "GET",
        });
        expect(resp.status).toEqual(401);
    });

    test("Stop SAM", async () => {
        sam!.stop();
    });
});

describe("Test request authentication", () => {
    let testUser: User;
    let authToken: string;

    test("Prepare: Create test user", async () => {
        let result = await createUserAndSubscribeToExampleApp(context);
        testUser = result.testUser;
        authToken = result.token;
        console.log("testUser", chalk.blue(UserPK.stringify(testUser)));
        console.log("authToken", chalk.blue(authToken));
    });

    let sam: SAM | undefined;
    test("Start local SAM", async () => {
        sam = await startLocalSAM();
    });

    test("Unauthorized requests should fail with 401", async () => {
        let requestUrl = new URL(sam!.url.href);
        requestUrl.pathname = "/echo";
        requestUrl.host = "127.0.0.1";
        let resp = await fetch(requestUrl.href, {
            method: "GET",
            headers: {
                Host: "example.localhost",
            },
        });
        expect(resp.status).toEqual(401);
    });

    test("Authorized requests should succeed", async () => {
        let requestUrl = new URL(sam!.url.href);
        requestUrl.pathname = "/echo";
        requestUrl.host = "127.0.0.1";
        let resp = await fetch(requestUrl.href, {
            method: "GET",
            headers: {
                Host: "example.localhost",
                "X-User-PK": UserPK.stringify(testUser), // trust user pk header test mode enabled
            },
        });
        expect(resp.status).toEqual(200);
    });

    test("Stop SAM", async () => {
        sam!.stop();
    });
});

describe("Test request header passthrough", () => {
    let testUser: User;
    let authToken: string;

    test("Prepare: Create test user", async () => {
        let result = await createUserAndSubscribeToExampleApp(context);
        testUser = result.testUser;
        authToken = result.token;
    });

    test("Prepare: Subscribe to the example app", async () => {
        let pricing = await context.batched.Pricing.get({
            app: AppPK.stringify({
                name: "example",
            }),
            name: "Free",
        });
        await context.batched.Subscription.getOrCreate({
            subscriber: UserPK.stringify(testUser),
            pricing: PricingPK.stringify(pricing),
        });
    });
});

type SAM = {
    url: URL;
    stop: () => void;
};
async function startLocalSAM(): Promise<SAM> {
    const port = 6001 + Math.floor(998 * Math.random());
    const url = `http://127.0.0.1:${port}`;
    const sam = spawn("sam", ["local", "start-api", "--port", port.toString(), "-n", "./testenv.json"], {
        cwd: path.join(__dirname, ".."),
    });

    sam.stdout.on("data", (data) => {
        console.log(`SAM: ${data}`);
    });

    sam.stderr.on("data", (data) => {
        console.log(`SAM: ${data}`);
    });

    sam.on("close", (code) => {
        console.log(`SAM exited with code ${code}`);
    });

    for (let i = 0; i < 4; i++) {
        console.log("Waiting for SAM to start...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
        try {
            await fetch(url, {
                method: "OPTIONS",
            });
            break;
        } catch (error) {
            // ignore
        }
    }

    return {
        url: new URL(url),
        stop: () => {
            sam.kill();
        },
    };
}

type CreateUserAndSubscribeToExampleAppResult = {
    testUser: User;
    token: string;
};
async function createUserAndSubscribeToExampleApp(context: RequestContext) {
    const testUserEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    let testUser = await getOrCreateTestUser(context, { email: testUserEmail });

    let appPK = AppPK.stringify({
        name: "example",
    });
    let userPK = UserPK.stringify(testUser);
    let pricing = await context.batched.Pricing.get({
        app: appPK,
        name: "Free",
    });
    await context.batched.Subscription.getOrCreate({
        app: appPK,
        subscriber: userPK,
        pricing: PricingPK.stringify(pricing),
    });

    let { userAppToken, token } = await createUserAppToken(context, { user: userPK, app: appPK });
    return {
        testUser,
        token,
    };
}
