import { HttpMethod } from "@/src/__generated__/resolvers-types";
import { App } from "@/src/database/models/App";
import { Endpoint } from "@/src/database/models/Endpoint";
import { User } from "@/src/database/models/User";
import { AppPK } from "@/src/pks/AppPK";
import { EndpointPK } from "@/src/pks/EndpointPK";
import { UserPK } from "@/src/pks/UserPK";
import { graphql } from "@/src/typed-graphql";
import {
  baseRequestContext as context,
  getOrCreateTestUser,
  simplifyGraphQLPromiseRejection,
  sortGraphQLErrors,
} from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import * as uuid from "uuid";

describe("getEndpoint", () => {
  let testApp: App;
  let testAppOwner: User;
  let testOtherUser: User;
  let testEndpoint: Endpoint;

  beforeEach(async () => {
    testAppOwner = await getOrCreateTestUser(context, {
      email: "test-user" + uuid.v4(),
    });
    testOtherUser = await getOrCreateTestUser(context, {
      email: "test-user" + uuid.v4(),
    });
    testApp = await context.batched.App.create({
      name: "test-app" + uuid.v4(),
      title: "Test App",
      description: "Test app description",
      homepage: "https://example.com",
      owner: UserPK.stringify(testAppOwner),
      repository: "",
    });
    testEndpoint = await context.batched.Endpoint.create({
      app: AppPK.stringify(testApp),
      description: "Test endpoint description",
      path: "/test-endpoint",
      method: HttpMethod.Get,
      destination: "https://example.com",
    });
  });

  const queryGetEndpointAllAttributes = graphql(`
    query getEndpoint($pk: ID!) {
      getEndpoint(pk: $pk) {
        pk
        method
        description
        path
        createdAt
        updatedAt
        destination
        app {
          pk
        }
      }
    }
  `);

  test("App owner can read all endpoint attributes", async () => {
    const promise = getTestGQLClient({ user: testAppOwner }).query({
      query: queryGetEndpointAllAttributes,
      variables: {
        pk: EndpointPK.stringify(testEndpoint),
      },
    });
    const { createdAt, description, destination, method, path, updatedAt } = testEndpoint;
    await expect(promise).resolves.toMatchObject({
      data: {
        getEndpoint: {
          __typename: "Endpoint",
          pk: EndpointPK.stringify(testEndpoint),
          createdAt: createdAt.toISOString(),
          description,
          destination,
          method,
          path,
          updatedAt: updatedAt.toISOString(),
          app: {
            __typename: "App",
            pk: AppPK.stringify(testApp),
          },
        },
      },
    });
  });

  test("Other user cannot read Endpoint private attributes", async () => {
    const promise = getTestGQLClient({ user: testOtherUser }).query({
      query: queryGetEndpointAllAttributes,
      variables: {
        pk: EndpointPK.stringify(testEndpoint),
      },
    });

    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject(
      sortGraphQLErrors([
        {
          code: "PERMISSION_DENIED",
          message: "You do not have permission to perform this action.",
          path: "getEndpoint.createdAt",
        },
        {
          code: "PERMISSION_DENIED",
          message: "You do not have permission to perform this action.",
          path: "getEndpoint.destination",
        },
        {
          code: "PERMISSION_DENIED",
          message: "You do not have permission to perform this action.",
          path: "getEndpoint.updatedAt",
        },
      ])
    );
  });

  test("Other user cannot read Endpoint public attributes", async () => {
    const promise = getTestGQLClient({ user: testOtherUser }).query({
      query: graphql(`
        query TestGetEndpointPrivateAttributes($pk: ID!) {
          getEndpoint(pk: $pk) {
            pk
            description
            method
            path
            app {
              pk
            }
          }
        }
      `),
      variables: {
        pk: EndpointPK.stringify(testEndpoint),
      },
    });
    const { description, method, path } = testEndpoint;
    await expect(promise).resolves.toMatchObject({
      data: {
        getEndpoint: {
          __typename: "Endpoint",
          pk: EndpointPK.stringify(testEndpoint),
          description,
          method,
          path,
          app: {
            __typename: "App",
            pk: AppPK.stringify(testApp),
          },
        },
      },
    });
  });
});
