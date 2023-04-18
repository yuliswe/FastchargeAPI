import { describe, expect, jest, test } from "@jest/globals";
import { RequestContext } from "graphql-service/RequestContext";
import { createDefaultContextBatched } from "graphql-service/RequestContext";
import { getOrCreateTestUser } from "graphql-service/tests/test-utils";
import { spawn } from "child_process";
import path from "path";
import fetchNative, { Response } from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import { User } from "graphql-service/dynamoose/models";
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
const gatewayHost = "localhost";

// graphql-service lambda cold start can take a while, causing occasional HTTP
// 502 failures. This function retries the request with exponential backoff.
async function fetch(url: URL | string, options: any): Promise<Response> {
    const maxAttempts = 5;
    let result: Response;
    for (let i = 0; i < maxAttempts; i++) {
        result = await fetchNative(url, options);
        if (result.status === 502 && i < maxAttempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, 2 ** i * 1000));
            continue;
        }
    }
    return result!;
}

// beforeAll(async () => {
//     await buildSAM();
// }, 180_000);

describe("Test CORS requests", () => {
    let sam: SAM;
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
        await sam!.stop();
    });
});

describe("Test request authentication", () => {
    let testUser: User;
    let authToken: string;

    test("Prepare: Create test user", async () => {
        let result = await createUserAndSubscribeToExampleApp(context);
        testUser = result.testUser;
        authToken = result.token;
    });

    let sam: SAM;
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
                Host: `example.${gatewayHost}`,
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
                Host: `example.${gatewayHost}`,
                "X-User-PK": UserPK.stringify(testUser), // requires trust user pk header test mode enabled
                "X-User-Email": testUser.email, // requires trust user email header test mode enabled
            },
        });
        expect(resp.status).toEqual(200);
    });

    test("Stop SAM", async () => {
        await sam.stop();
    });
});

type EchoEndpointResponse = {
    headers: { [header: string]: string };
    body: string;
    queryParams: { [param: string]: string };
};

describe("Test request header passthrough", () => {
    let testUser: User;
    let authToken: string;

    test("Prepare: Create test user", async () => {
        let result = await createUserAndSubscribeToExampleApp(context);
        testUser = result.testUser;
        authToken = result.token;
    });

    let sam: SAM;
    test("Start local SAM", async () => {
        sam = await startLocalSAM();
    });

    // http://example.${gatewayHost}/echo is an endpoint that simply echos the lambda event in the response
    test(`Send request to http://example.${gatewayHost}/echo and check the headers are passed through`, async () => {
        let requestUrl = new URL(sam!.url.href);
        requestUrl.pathname = "/echo";
        requestUrl.host = "127.0.0.1";
        let resp = await fetch(requestUrl.href, {
            method: "POST",
            headers: {
                Host: `example.${gatewayHost}`,
                "X-User-PK": UserPK.stringify(testUser), // requires trust user pk header test mode enabled
                "X-User-Email": testUser.email, // requires trust user email header test mode enabled
                "X-FAST-API-KEY": "X-FAST-API-KEY",
                "Custom-Header": "Custom-Header",
            },
            timeout: 10_000,
        });
        expect(resp.status).toEqual(200);
        const echo: EchoEndpointResponse = await resp.json();
        const headersLowerCased: { [header: string]: string } = {};
        for (const [header, value] of Object.entries(echo.headers)) {
            if (value) {
                headersLowerCased[header.toLowerCase()] = value;
            }
        }
        expect(headersLowerCased["x-fast-user"]).toStrictEqual([UserPK.stringify(testUser)]); // Check that X-Fast-User is set
        expect(headersLowerCased["x-user-pk"]).toStrictEqual(undefined);
        expect(headersLowerCased["x-fast-api-key"]).toStrictEqual(undefined); // Check that X-FAST-API-KEY is not leaked
        expect(headersLowerCased["custom-header"]).toStrictEqual(["Custom-Header"]); // Any custom header should be kept
    });

    test(`Send request to http://example.${gatewayHost}/echo and check the body is passed`, async () => {
        let requestUrl = new URL(sam!.url.href);
        requestUrl.pathname = "/echo";
        requestUrl.host = "127.0.0.1";
        let resp = await fetch(requestUrl.href, {
            method: "POST",
            headers: {
                Host: `example.${gatewayHost}`,
                "X-User-PK": UserPK.stringify(testUser), // requires trust user pk header test mode enabled
                "X-User-Email": testUser.email, // requires trust user email header test mode enabled
            },
            body: JSON.stringify({ a: 1, b: 2 }),
            timeout: 10_000,
        });
        expect(resp.status).toEqual(200);
        const echo: EchoEndpointResponse = await resp.json();
        const body = JSON.parse(echo.body!);
        expect(body).toStrictEqual({ a: 1, b: 2 });
    });

    test(`Send request to http://example.${gatewayHost}/echo?a=1&a=2&b=3&c and check the URL query is passed`, async () => {
        let requestUrl = new URL(sam!.url.href);
        requestUrl.pathname = "/echo";
        requestUrl.search = "a=1&a=2&b=3&c";
        requestUrl.host = "127.0.0.1";
        let resp = await fetch(requestUrl.href, {
            method: "POST",
            headers: {
                Host: `example.${gatewayHost}`,
                "X-User-PK": UserPK.stringify(testUser), // requires trust user pk header test mode enabled
                "X-User-Email": testUser.email, // requires trust user email header test mode enabled
            },
            timeout: 10_000,
        });
        expect(resp.status).toEqual(200);
        const echo: EchoEndpointResponse = await resp.json();
        expect(echo.queryParams).toStrictEqual({ a: ["1", "2"], b: ["3"], c: [""] });
    });

    test("Stop SAM", async () => {
        await sam.stop();
    });
});

function getArch(): string {
    switch (process.arch) {
        case "x64":
            return "x86_64";
        default:
            return "arm64";
    }
}

type SAM = {
    url: URL;
    stop: () => Promise<void>;
};
async function startLocalSAM(): Promise<SAM> {
    const port = 6001 + Math.floor(998 * Math.random());
    const url = `http://127.0.0.1:${port}`;
    const sam = spawn(
        "sam",
        [
            "local",
            "start-api",
            "--port",
            port.toString(),
            "-n",
            "./testenv.json",
            "--parameter-overrides",
            `Architecture=${getArch()}`,
            ...platformRunOptions(),
        ],
        {
            cwd: path.join(__dirname, ".."),
        }
    );

    sam.stdout.on("data", (data) => {
        console.log(`SAM: ${data}`);
    });

    sam.stderr.on("data", (data) => {
        console.log(`SAM: ${data}`);
    });

    const maxRetries = 4;
    let i = 0;
    for (i = 0; i < maxRetries; i++) {
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

    if (i === maxRetries) {
        throw new Error("SAM failed to start");
    }

    return {
        url: new URL(url),
        stop: async (): Promise<void> => {
            sam.stdout.destroy();
            sam.stderr.destroy();
            let ret = new Promise<void>((resolve) => sam.on("close", resolve));
            sam.kill("SIGINT");
            return ret;
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

function platformRunOptions(): string[] {
    switch (getArch()) {
        case "x86_64":
            return [];
        default:
            return [];
    }
}
