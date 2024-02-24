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
} from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import * as uuid from "uuid";

const updateEndpointMutation = graphql(`
  mutation TestUpdateEndpointMutation(
    $pk: ID!
    $path: String
    $method: HttpMethod
    $destination: String
    $description: String
  ) {
    getEndpoint(pk: $pk) {
      updateEndpoint(path: $path, method: $method, destination: $destination, description: $description) {
        pk
        path
        method
        destination
        description
        createdAt
        updatedAt
        app {
          pk
        }
      }
    }
  }
`);

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

  test("App owner can update endpoint", async () => {
    const variables = {
      pk: EndpointPK.stringify(testEndpoint),
      path: "/test-endpoint-updated",
      method: HttpMethod.Post,
      destination: "https://example.com/updated",
      description: "Test endpoint description updated",
    };
    const promise = getTestGQLClient({ user: testAppOwner }).mutate({
      mutation: updateEndpointMutation,
      variables,
    });
    await expect(promise).resolves.toMatchObject({
      data: {
        getEndpoint: {
          updateEndpoint: {
            pk: EndpointPK.stringify(testEndpoint),
            path: variables.path,
            method: variables.method,
            destination: variables.destination,
            description: variables.description,
            createdAt: expect.any(Number),
            updatedAt: expect.any(Number),
            app: {
              pk: AppPK.stringify(testApp),
            },
          },
        },
      },
    });
  });

  test("Other users cannot update endpoint", async () => {
    const variables = {
      pk: EndpointPK.stringify(testEndpoint),
      path: "/test-endpoint-updated",
      method: HttpMethod.Post,
      destination: "https://example.com/updated",
      description: "Test endpoint description updated",
    };
    const promise = getTestGQLClient({ user: testOtherUser }).mutate({
      mutation: updateEndpointMutation,
      variables,
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchInlineSnapshot(`
            [
              {
                "code": "PERMISSION_DENIED",
                "message": "You do not have permission to perform this action.",
                "path": "getEndpoint.updateEndpoint",
              },
            ]
        `);
  });
});
