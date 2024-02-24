import { AppVisibility, GatewayMode } from "@/src/__generated__/gql/graphql";
import { App } from "@/src/database/models/App";
import { AppTag } from "@/src/database/models/AppTag";
import { User } from "@/src/database/models/User";
import { updateAppSearchIndex } from "@/src/functions/app";
import { AppPK } from "@/src/pks/AppPK";
import { UserPK } from "@/src/pks/UserPK";
import { graphql } from "@/src/typed-graphql";
import { baseRequestContext, getOrCreateTestUser } from "@/tests/test-utils/test-utils";
import { getTestGQLClient } from "@/tests/test-utils/testGQLClients";
import { v4 as uuidv4 } from "uuid";

const context = baseRequestContext;

const queryAppFullTextSearch = graphql(`
  query TestappFullTextSearch($query: String!, $tag: String) {
    appFullTextSearch(query: $query, tag: $tag) {
      pk
      tags {
        tag
      }
    }
  }
`);

let testAppOwner: User;
let testOtherUser: User;
let testApp: App;
let testAppTag: AppTag;
beforeAll(async () => {
  testAppOwner = await getOrCreateTestUser(context, {
    email: `testAppOwner_${uuidv4()}@gmail_mock.com`,
  });
  testOtherUser = await getOrCreateTestUser(context, {
    email: `testOtherUser_${uuidv4()}@gmail_mock.com`,
  });
  testApp = await context.batched.App.create({
    name: `testapp-${uuidv4()}`,
    owner: UserPK.stringify(testAppOwner),
    title: "Test App",
    description: "Test App Description",
    homepage: "https://fastchargeapi.com",
    repository: "https://github/myrepo",
    gatewayMode: GatewayMode.Proxy,
    visibility: AppVisibility.Public,
    readme: "readme",
  });
  testAppTag = await context.batched.AppTag.create({
    app: AppPK.stringify(testApp),
    tag: `testtag-${uuidv4()}`,
  });
  await updateAppSearchIndex(context, [testApp]);
});

describe("appFullTextSearch", () => {
  test("Search by app name substring", async () => {
    const promise = getTestGQLClient({ user: testOtherUser }).query({
      query: queryAppFullTextSearch,
      variables: {
        query: testApp.name.replace(/test-app/, "").slice(0, -3), // create a substring
      },
    });
    await expect(promise).resolves.toMatchObject({
      data: {
        appFullTextSearch: [
          {
            __typename: "App",
            pk: AppPK.stringify(testApp),
            tags: [
              {
                __typename: "AppTag",
                tag: testAppTag.tag,
              },
            ],
          },
        ],
      },
    });
  });

  test("Search by app name substring, constraint the search to the tag", async () => {
    const promise = getTestGQLClient({ user: testOtherUser }).query({
      query: queryAppFullTextSearch,
      variables: {
        query: testApp.name.replace(/test-app/, ""), // create a substring
        tag: testAppTag.tag,
      },
    });
    await expect(promise).resolves.toMatchObject({
      data: {
        appFullTextSearch: [
          {
            __typename: "App",
            pk: AppPK.stringify(testApp),
            tags: [
              {
                __typename: "AppTag",
                tag: testAppTag.tag,
              },
            ],
          },
        ],
      },
    });
  });
});
