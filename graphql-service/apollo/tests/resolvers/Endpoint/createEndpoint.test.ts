import { HttpMethod } from "@/src/__generated__/resolvers-types";
import { App } from "@/src/database/models/App";
import { User } from "@/src/database/models/User";
import { AppPK } from "@/src/pks/AppPK";
import { UserPK } from "@/src/pks/UserPK";
import { graphql } from "@/src/typed-graphql";
import {
  baseRequestContext as context,
  getOrCreateTestUser,
  simplifyGraphQLPromiseRejection,
} from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import * as uuid from "uuid";

const createEndpointMutation = graphql(`
  mutation CreateEndpoint(
    $app: ID!
    $path: String!
    $method: HttpMethod!
    $destination: String!
    $description: String
  ) {
    createEndpoint(app: $app, path: $path, method: $method, destination: $destination, description: $description) {
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
`);

describe("createEndpoint", () => {
  let testApp: App;
  let testAppOwner: User;
  let testOtherUser: User;

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
  });

  test("App owner can create endpoint", async () => {
    const variables = {
      app: AppPK.stringify(testApp),
      path: "/test-endpoint",
      method: HttpMethod.Get,
      destination: "https://example.com",
      description: "Test endpoint description",
    };
    const promise = getTestGQLClient({ user: testAppOwner }).mutate({
      mutation: createEndpointMutation,
      variables,
    });
    const { description, destination, method, path } = variables;
    await expect(promise).resolves.toMatchObject({
      data: {
        createEndpoint: {
          __typename: "Endpoint",
          pk: expect.any(String),
          app: {
            __typename: "App",
            pk: AppPK.stringify(testApp),
          },
          description,
          destination,
          method,
          path,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      },
    });
  });

  test("A user cannot create endpoint for an app that doesn't belong to them", async () => {
    const promise = getTestGQLClient({ user: testOtherUser }).mutate({
      mutation: createEndpointMutation,
      variables: {
        app: AppPK.stringify(testApp),
        path: "/test-endpoint",
        method: HttpMethod.Get,
        destination: "https://example.com",
        description: "Test endpoint description",
      },
    });
    await expect(simplifyGraphQLPromiseRejection(promise)).rejects.toMatchObject([
      {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        path: "createEndpoint",
      },
    ]);
  });
});
