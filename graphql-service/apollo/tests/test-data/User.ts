import { RequestContext } from "@/RequestContext";
import { UserCreateProps } from "@/database/models/User";
import { MD5 } from "object-hash";
import * as uuid from "uuid";

export function createTestUser(context: RequestContext, overrides: Partial<UserCreateProps> = {}) {
  const testEmail = overrides.email ?? `test-user-email-${uuid.v4()}@test.com`;
  return context.batched.User.create({
    uid: MD5(testEmail),
    email: testEmail,
    stripeConnectAccountId: "stripeConnectAccountId",
    ...overrides,
  });
}
