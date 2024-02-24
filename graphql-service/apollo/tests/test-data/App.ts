import { RequestContext } from "@/src/RequestContext";
import { AppCreateProps } from "@/src/database/models/App";
import { UserPK } from "@/src/pks/UserPK";
import { createTestUser } from "@/tests/test-data/User";
import * as uuid from "uuid";

export async function createTestApp(context: RequestContext, overwrites?: Partial<AppCreateProps>) {
  return context.batched.App.create({
    name: `testapp-${uuid.v4()}`,
    owner: overwrites?.owner ?? UserPK.stringify(await createTestUser(context)),
  });
}
