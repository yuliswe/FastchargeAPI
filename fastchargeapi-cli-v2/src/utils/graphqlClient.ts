import { getGQLClient } from "src/graphqlClient";
import { readOrRefreshAuthFileContentOrExit } from "src/utils/authFile";

export async function getAuthorizedGQLClient(args: { profile?: string }) {
  const { profile } = args;
  const authFile = await readOrRefreshAuthFileContentOrExit({ profile });
  return getGQLClient(authFile);
}
