import { makeFastchargeAPIIdTokenForUser } from "@/src/functions/user";
import { UserPK } from "@/src/pks/UserPK";
import { createTestUser } from "@/tests/test-data/User";
import { baseRequestContext as context } from "@/tests/test-utils/test-utils";
import * as firebaseModuleAuth from "@firebase/auth";

export function loginAsNewAnonymousUser() {
  console.log("Log in as anonymous user");
  return jest.spyOn(firebaseModuleAuth, "getAuth").mockReturnValue({
    currentUser: {
      isAnonymous: true,
      getIdToken() {
        return "anonymous";
      },
    },
    onAuthStateChanged: jest.fn(),
  } as never);
}

export async function loginAsNewTestUser() {
  const testUser = await createTestUser(context);
  console.log("Log in as ", UserPK.stringify(testUser));
  const idToken = await makeFastchargeAPIIdTokenForUser({ user: testUser, expireInSeconds: 3600 });
  return jest.spyOn(firebaseModuleAuth, "getAuth").mockReturnValue({
    currentUser: {
      isAnonymous: false,
      getIdToken() {
        return idToken;
      },
    },
    onAuthStateChanged: jest.fn(),
  } as never);
}
