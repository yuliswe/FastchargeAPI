import { graphql } from "src/__generated__/gql";
import { GQLClient } from "src/graphqlClient";
import { NotFoundSimpleGQLError } from "src/simplifiedGQLErrors";

export async function getAppPKByPKOrName(args: { client: GQLClient; pkOrName: string }) {
  const { client, pkOrName } = args;
  try {
    const result = await client.mutate({
      mutation: graphql(`
        mutation GetAppPKByName($appName: String!) {
          getAppByName(name: $appName) {
            pk
          }
        }
      `),
      variables: {
        appName: pkOrName,
      },
    });
    return result.data.getAppByName.pk;
  } catch (e) {
    if (e instanceof NotFoundSimpleGQLError) {
      const result = await client.mutate({
        mutation: graphql(`
          mutation GetAppPKById($pk: ID!) {
            getApp(pk: $pk) {
              pk
            }
          }
        `),
        variables: {
          pk: pkOrName,
        },
      });
      return result.data.getApp.pk;
    }
    throw e;
  }
}
