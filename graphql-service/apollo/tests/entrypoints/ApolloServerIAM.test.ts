import { App } from "@/database/models/App";
import { User } from "@/database/models/User";
import { describe, expect, test } from "@jest/globals";
/** We want to test the actual aws handler */
// eslint-disable-next-line no-restricted-imports
import { lambdaHandler } from "../../lambdaHandler";
import { LambdaEvent } from "../../lambdaHandlerUtils";
import { AppPK } from "../../pks/AppPK";
import { UserPK } from "../../pks/UserPK";
import { createTestApp } from "../test-data/App";
import { createTestUser } from "../test-data/User";
import { baseRequestContext as context } from "../test-utils/test-utils";

const lambdaEvent: LambdaEvent = {
  resource: "/",
  path: "/",
  httpMethod: "POST",
  headers: {
    "accept-encoding": "gzip",
    "content-type": "application/json",
    Date: "2023-03-21T07:38:51Z",
    Host: "api.iam.graphql.fastchargeapi.com",
    "User-Agent": "Go-http-client/2.0",
    "x-amz-date": "20230321T073851Z",
    "x-amz-security-token":
      "IQoJb3JpZ2luX2VjEMD//////////wEaCXVzLWVhc3QtMSJHMEUCIFZI2VIzrepZQqt7y5v/hdH27tXK0+NzutaTNrab86U4AiEAnaPLgf8OV5UwB0m/wJMiBpeHD4IhaF+/L4yDZMfXJdQqtgMIif//////////ARAAGgw4ODcyNzk5MDE4NTMiDDSZB085prWA33AblyqKAzJe3sfd41hkxMqykR78UnQ9B54floACL1UziQETGiSc8g5eNLmg5dLXMk4q3uvnIaNpPgAkqyXeL0s4v0tXHN2mCVkxUxowTvKe1hBh9+P3ipB+aBAsF6tKwRo1BKNpJoGwaUHsNWmfaTAfT82zYeML8q+6NWboT2wGyb9Y53zacMsgLawmzOD7CrE1DjP0AbFOmIwy4R9xE0sokwR9GymPL4MQZd4Q9r/QZ4+mJb6aBEKfpnfQEl6IPn2PMyQYViit9N3UEWK6pkEDn+Nf8maNeiqUK8WKe/gTwMfV3fU9ae2UvnLuY4KPGHC4pps0Owv2BtNfjZvsQ/8T/tT6Pw4Mh116DwsqqBMneMAR539q8+Jg0/FgyQMhVNVfa2O1xVOWxPHSwQdXO/yTHoN3pbVylQjtInS5A+3hIUH5GoShaluM1tBSL0n7Wq0c2LySQJJbo+vE3iz8cUCTsgPsvVnAE3CYT265akWe3NJvJRKM57fFHJAR9Sdow+OQ0sDuE/bWdsvf9YfsJ8EwkbrloAY6nQHbtnK3e+m2pl77rdVCFtYBh57DRIvUtsUdQiTt9zxkkEkYUrRoykLGkpq1Z5Rvux5FPIIF6UqcB/vLXvjoOWq0U0yMDjdd5ux7Sp3f7jN8ihlL1JOCPXbqyzAoCmsCrNIljajiy7ESiaVYCdUO/NjAbWfIzP5bNCGwJok3LXDykuj4Hi1Kkukv1sP34Bp5m4gZ2idJb0Nx2mqHpPJ1",
    "X-Amzn-Trace-Id": "Root=1-64195f0b-3f1024357772481138e89f78",
    "X-Forwarded-For": "54.89.234.29",
    "X-Forwarded-Port": "443",
    "X-Forwarded-Proto": "https",
    "x-service-name": "gateway",
    "x-user-email": "user_3a780e06e56465ae13a592f075628c08",
  },
  multiValueHeaders: {
    "accept-encoding": ["gzip"],
    "content-type": ["application/json"],
    Date: ["2023-03-21T07:38:51Z"],
    Host: ["api.iam.graphql.fastchargeapi.com"],
    "User-Agent": ["Go-http-client/2.0"],
    "x-amz-date": ["20230321T073851Z"],
    "x-amz-security-token": [
      "IQoJb3JpZ2luX2VjEMD//////////wEaCXVzLWVhc3QtMSJHMEUCIFZI2VIzrepZQqt7y5v/hdH27tXK0+NzutaTNrab86U4AiEAnaPLgf8OV5UwB0m/wJMiBpeHD4IhaF+/L4yDZMfXJdQqtgMIif//////////ARAAGgw4ODcyNzk5MDE4NTMiDDSZB085prWA33AblyqKAzJe3sfd41hkxMqykR78UnQ9B54floACL1UziQETGiSc8g5eNLmg5dLXMk4q3uvnIaNpPgAkqyXeL0s4v0tXHN2mCVkxUxowTvKe1hBh9+P3ipB+aBAsF6tKwRo1BKNpJoGwaUHsNWmfaTAfT82zYeML8q+6NWboT2wGyb9Y53zacMsgLawmzOD7CrE1DjP0AbFOmIwy4R9xE0sokwR9GymPL4MQZd4Q9r/QZ4+mJb6aBEKfpnfQEl6IPn2PMyQYViit9N3UEWK6pkEDn+Nf8maNeiqUK8WKe/gTwMfV3fU9ae2UvnLuY4KPGHC4pps0Owv2BtNfjZvsQ/8T/tT6Pw4Mh116DwsqqBMneMAR539q8+Jg0/FgyQMhVNVfa2O1xVOWxPHSwQdXO/yTHoN3pbVylQjtInS5A+3hIUH5GoShaluM1tBSL0n7Wq0c2LySQJJbo+vE3iz8cUCTsgPsvVnAE3CYT265akWe3NJvJRKM57fFHJAR9Sdow+OQ0sDuE/bWdsvf9YfsJ8EwkbrloAY6nQHbtnK3e+m2pl77rdVCFtYBh57DRIvUtsUdQiTt9zxkkEkYUrRoykLGkpq1Z5Rvux5FPIIF6UqcB/vLXvjoOWq0U0yMDjdd5ux7Sp3f7jN8ihlL1JOCPXbqyzAoCmsCrNIljajiy7ESiaVYCdUO/NjAbWfIzP5bNCGwJok3LXDykuj4Hi1Kkukv1sP34Bp5m4gZ2idJb0Nx2mqHpPJ1",
    ],
    "X-Amzn-Trace-Id": ["Root=1-64195f0b-3f1024357772481138e89f78"],
    "X-Forwarded-For": ["54.89.234.29"],
    "X-Forwarded-Port": ["443"],
    "X-Forwarded-Proto": ["https"],
    "x-service-name": ["gateway"],
    "x-user-email": ["user_3a780e06e56465ae13a592f075628c08"],
  },
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  pathParameters: null,
  stageVariables: null,
  requestContext: {
    resourceId: "trj3t292ei",
    resourcePath: "/",
    httpMethod: "POST",
    extendedRequestId: "CHvJ0FG9oAMF4gw=",
    requestTime: "21/Mar/2023:07:38:51 +0000",
    path: "/",
    accountId: "887279901853",
    protocol: "HTTP/1.1",
    stage: "DEV",
    domainPrefix: "api",
    requestTimeEpoch: 1679384331350,
    requestId: "b2b0612e-8e0f-4772-8569-740f3171b038",
    // authorizer: undefined,
    identity: {
      // apiKey: null,
      // apiKeyId: null,
      // clientCert: null,
      /// missing
      cognitoIdentityPoolId: null,
      accountId: "887279901853",
      cognitoIdentityId: null,
      caller: "AROA45FQA3SOYBIDJ35GB:gateway-service-GatewayFunction-Yb9hvG8gT1to",
      sourceIp: "54.89.234.29",
      principalOrgId: null,
      accessKey: "ASIA45FQA3SOQX5UHZP2",
      cognitoAuthenticationType: null,
      cognitoAuthenticationProvider: null,
      userArn:
        "arn:aws:sts::887279901853:assumed-role/gateway-service-GatewayFunctionRole-1W1B1D249LFTB/gateway-service-GatewayFunction-Yb9hvG8gT1to",
      userAgent: "Go-http-client/2.0",
      user: "AROA45FQA3SOYBIDJ35GB:gateway-service-GatewayFunction-Yb9hvG8gT1to",
    },
    domainName: "api.iam.graphql.fastchargeapi.com",
    apiId: "d8we8h9ish",
  },
  body: JSON.stringify({
    query:
      "\n" +
      "query CheckUserIsAllowedToCallEndpoint ($user: ID!, $app: ID!) {\n" +
      "\tcheckUserIsAllowedForGatewayRequest(user: $user, app: $app) {\n" +
      "\t\tallowed\n" +
      "\t\treason\n" +
      "\t\tpricingPK\n" +
      "\t\tuserPK\n" +
      "\t}\n" +
      "}\n",
    variables: { user: "user_3a780e06e56465ae13a592f075628c08", app: "myapp" },
    operationName: "CheckUserIsAllowedToCallEndpoint",
  }),
  isBase64Encoded: false,
} as unknown as LambdaEvent;

describe("Test a request from the gateway", () => {
  let testApp: App;
  let testUser: User;

  beforeEach(async () => {
    testApp = await createTestApp(context);
    testUser = await createTestUser(context);
  });

  test("Replay a request to https://myapp.fastchargeapi.com/google", async () => {
    const response = await lambdaHandler(
      {
        ...lambdaEvent,
        body: JSON.stringify({
          query:
            "\n" +
            "query CheckUserIsAllowedToCallEndpoint ($user: ID!, $app: ID!) {\n" +
            "\tcheckUserIsAllowedForGatewayRequest(user: $user, app: $app) {\n" +
            "\t\tallowed\n" +
            "\t\treason\n" +
            "\t\tpricingPK\n" +
            "\t\tuserPK\n" +
            "\t}\n" +
            "}\n",
          variables: { user: UserPK.stringify(testUser), app: AppPK.stringify(testApp) },
          operationName: "CheckUserIsAllowedToCallEndpoint",
        }),
      },
      {} as never,
      ((_err: never, _res: never) => {
        // nothing
      }) as never
    );
    for (let i = 0; i < 3; i++) {
      // Wait for the balance check to complete
      console.log("Waiting for balance check to complete", i);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // TODO: Verify the balance check is complete
    }
    expect(response.statusCode).toBe(200);
  });
});
