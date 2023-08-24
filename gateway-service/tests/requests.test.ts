import { afterAll, beforeAll, describe, expect, jest, test } from "@jest/globals";
import { spawn } from "child_process";
import fs from "fs";
import { RequestContext, createDefaultContextBatched } from "graphql-service/RequestContext";
import { User } from "graphql-service/dynamoose/models";
import { createUserAppToken } from "graphql-service/functions/token";
import { AppPK } from "graphql-service/pks/AppPK";
import { PricingPK } from "graphql-service/pks/PricingPK";
import { UserPK } from "graphql-service/pks/UserPK";
import { getOrCreateTestUser } from "graphql-service/tests/test-utils";
import fetchNative, { Response } from "node-fetch";
import path from "path";
import tmp from "tmp";
import { v4 as uuidv4 } from "uuid";

const context: RequestContext = {
    batched: createDefaultContextBatched(),
    isServiceRequest: true,
    isSQSMessage: true,
    isAnonymousUser: false,
    isAdminUser: false,
};

jest.setTimeout(60_000);

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

let testUser: User;
let sam: SAM;
beforeAll(async () => {
    sam = await startLocalSAM();
    const result = await createUserAndSubscribeToExampleApp(context);
    testUser = result.testUser;
});

afterAll(async () => {
    await sam?.stop();
});

describe("Test CORS requests", () => {
    test("CORS to / (or any route) should succeed", async () => {
        const resp = await fetch(sam!.url, {
            method: "OPTIONS",
        });
        expect(resp.status).toEqual(200);
        expect(resp.headers.get("Access-Control-Allow-Origin")).toEqual("*");
        expect(resp.headers.get("Access-Control-Allow-Methods")).toEqual("*");
        expect(resp.headers.get("Access-Control-Allow-Headers")).toEqual("*");
    });

    test("CORS to /some/path (or any route) should succeed", async () => {
        const resp = await fetch(sam!.url + "/some/path", {
            method: "OPTIONS",
        });
        expect(resp.status).toEqual(200);
        expect(resp.headers.get("Access-Control-Allow-Origin")).toEqual("*");
        expect(resp.headers.get("Access-Control-Allow-Methods")).toEqual("*");
        expect(resp.headers.get("Access-Control-Allow-Headers")).toEqual("*");
    });

    test("Requests should pass headers with 401", async () => {
        const resp = await fetch(sam!.url, {
            method: "GET",
        });
        expect(resp.status).toEqual(401);
    });
});

describe("Test request authentication", () => {
    test("Unauthorized requests should fail with 401", async () => {
        const requestUrl = new URL(sam!.url.href);
        requestUrl.pathname = "/echo";
        requestUrl.host = "127.0.0.1";
        const resp = await fetch(requestUrl.href, {
            method: "GET",
            headers: {
                Host: `example.localhost`,
            },
        });
        expect(resp.status).toEqual(401);
    });

    test("Authorized requests should succeed", async () => {
        const requestUrl = new URL(sam!.url.href);
        requestUrl.pathname = "/echo";
        requestUrl.host = "127.0.0.1";
        const resp = await fetch(requestUrl.href, {
            method: "GET",
            headers: {
                Host: `example.localhost`,
                "X-User-PK": UserPK.stringify(testUser), // requires trust user pk header test mode enabled
                "X-User-Email": testUser.email, // requires trust user email header test mode enabled
            },
        });
        expect(resp.status).toEqual(200);
    });
});

type EchoEndpointResponse = {
    headers: { [header: string]: string };
    body: string;
    queryParams: { [param: string]: string };
};

describe("Test request header passthrough", () => {
    // http://example.localhost/echo is an endpoint that simply echos the lambda event in the response
    test(`Send request to http://example.localhost/echo and check the headers are passed through`, async () => {
        const requestUrl = new URL(sam!.url.href);
        requestUrl.pathname = "/echo";
        requestUrl.host = "127.0.0.1";
        const resp = await fetch(requestUrl.href, {
            method: "POST",
            headers: {
                Host: `example.localhost`,
                "X-User-PK": UserPK.stringify(testUser), // requires trust user pk header test mode enabled
                "X-User-Email": testUser.email, // requires trust user email header test mode enabled
                "X-FAST-API-KEY": "X-FAST-API-KEY",
                "Custom-Header": "Custom-Header",
                "Custom-Header-Multi": ["Custom-Header-Multi0", "Custom-Header-Multi1"],
            },
            timeout: 10_000,
        });

        const respText = await resp.text();
        console.log(resp.status, resp.statusText, respText);
        expect(resp.status).toEqual(200);
        const echo = JSON.parse(respText) as EchoEndpointResponse;
        const headersLowerCased: { [header: string]: string } = {};
        for (const [header, value] of Object.entries(echo.headers)) {
            if (value) {
                headersLowerCased[header.toLowerCase()] = value;
            }
        }
        expect(headersLowerCased["x-fast-user"]).toStrictEqual(UserPK.stringify(testUser)); // Check that X-Fast-User is set
        expect(headersLowerCased["x-user-pk"]).toStrictEqual(undefined);
        expect(headersLowerCased["x-fast-api-key"]).toStrictEqual(undefined); // Check that X-FAST-API-KEY is not leaked
        expect(headersLowerCased["custom-header"]).toStrictEqual("Custom-Header"); // Any custom header should be kept
        expect(headersLowerCased["custom-header-multi"]).toStrictEqual("Custom-Header-Multi0,Custom-Header-Multi1"); // Any custom header should be kept
    });

    test(`Send request to http://example.localhost/echo and check the body is passed`, async () => {
        const requestUrl = new URL(sam!.url.href);
        requestUrl.pathname = "/echo";
        requestUrl.host = "127.0.0.1";
        const resp = await fetch(requestUrl.href, {
            method: "POST",
            headers: {
                Host: `example.localhost`,
                "X-User-PK": UserPK.stringify(testUser), // requires trust user pk header test mode enabled
                "X-User-Email": testUser.email, // requires trust user email header test mode enabled
            },
            body: JSON.stringify({ a: 1, b: 2 }),
            timeout: 10_000,
        });
        const respText = await resp.text();
        console.log(resp.status, resp.statusText, respText);
        expect(resp.status).toEqual(200);
        const echo = JSON.parse(respText) as EchoEndpointResponse;
        expect(JSON.parse(echo.body)).toStrictEqual({ a: 1, b: 2 });
    });

    test(`Send request to http://example.localhost/echo?a=1&a=2&b=3&c and check the URL query is passed`, async () => {
        const requestUrl = new URL(sam!.url.href);
        requestUrl.pathname = "/echo";
        requestUrl.search = "a=1&a=2&b=3&c";
        requestUrl.host = "127.0.0.1";
        const resp = await fetch(requestUrl.href, {
            method: "POST",
            headers: {
                Host: `example.localhost`,
                "X-User-PK": UserPK.stringify(testUser), // requires trust user pk header test mode enabled
                "X-User-Email": testUser.email, // requires trust user email header test mode enabled
            },
            timeout: 10_000,
        });
        const respText = await resp.text();
        console.log(resp.status, resp.statusText, respText);
        expect(resp.status).toEqual(200);
        const echo = JSON.parse(respText) as EchoEndpointResponse;
        expect(echo.queryParams).toStrictEqual({ a: "1,2", b: "3", c: "" });
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

function makeParameterOverrides(overrides: { [key: string]: string }): string {
    return Object.entries(overrides)
        .map(([key, value]) => `ParameterKey=${key},ParameterValue=${value}`)
        .join(" ");
}

function writeEnvVarToTempFile() {
    const tempfile = tmp.fileSync();
    fs.writeFileSync(
        tempfile.name,
        JSON.stringify({
            GatewayFunction: process.env,
        })
    );
    return tempfile.name;
}

async function startLocalSAM(): Promise<SAM> {
    const port = 6001 + Math.floor(998 * Math.random());
    const url = `http://127.0.0.1:${port}`;
    console.log(
        makeParameterOverrides({
            Authorizer: "NONE",
            Architecture: getArch(),
        })
    );

    const envfile = writeEnvVarToTempFile();
    try {
        const sam = spawn(
            "sam",
            [
                "local",
                "start-api",
                "--port",
                port.toString(),
                "--host",
                "0.0.0.0",
                "-n",
                envfile,
                "--parameter-overrides",
                makeParameterOverrides({
                    Authorizer: "NONE",
                    Architecture: getArch(),
                }),
                ...platformRunOptions(),
            ],
            {
                cwd: path.join(__dirname, ".."),
            }
        );

        const stop = async (): Promise<void> => {
            sam.stdout.destroy();
            sam.stderr.destroy();
            const ret = new Promise<void>((resolve) => sam.on("close", resolve));
            sam.kill("SIGINT");
            return ret;
        };

        try {
            sam.stdout.on("data", (data) => {
                console.log(`SAM: ${data}`);
            });

            sam.stderr.on("data", (data) => {
                console.log(`SAM: ${data}`);
            });

            const maxRetries = 50;
            let i = 0;
            for (i = 0; i < maxRetries; i++) {
                console.log("Waiting for SAM to start at", url);
                await new Promise((resolve) => setTimeout(resolve, 5000));
                try {
                    await fetch(url, {
                        method: "OPTIONS",
                    });
                    break;
                } catch (error) {
                    // ignore
                    console.log(error);
                }
            }

            if (i === maxRetries) {
                throw new Error("SAM failed to start");
            }

            return {
                url: new URL(url),
                stop,
            };
        } catch (e) {
            await stop();
            throw e;
        }
    } finally {
        fs.unlinkSync(envfile);
    }
}

type CreateUserAndSubscribeToExampleAppResult = {
    testUser: User;
    token: string;
};
// TODO: Create example app here on the fly
async function createUserAndSubscribeToExampleApp(
    context: RequestContext
): Promise<CreateUserAndSubscribeToExampleAppResult> {
    const testUserEmail = `testuser_${uuidv4()}@gmail_mock.com`;
    const testUser = await getOrCreateTestUser(context, { email: testUserEmail });

    const appPK = AppPK.stringify({
        name: "example",
    });
    const userPK = UserPK.stringify(testUser);
    const pricing = await context.batched.Pricing.get({
        app: appPK,
        name: "Free",
    });
    await context.batched.Subscription.getOrCreate({
        app: appPK,
        subscriber: userPK,
        pricing: PricingPK.stringify(pricing),
    });

    const { token } = await createUserAppToken(context, { user: userPK, app: appPK });
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
