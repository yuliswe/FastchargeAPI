import { makeFastchargeAPIIdTokenForUser } from "@/functions/user";
import { createTestUser } from "@/tests/test-data/User";
import { baseRequestContext as context } from "@/tests/test-utils/test-utils";
import * as firebaseModuleAuth from "@firebase/auth";

export function loginAsNewAnonymousUser() {
  return jest.spyOn(firebaseModuleAuth, "getAuth").mockReturnValue({
    currentUser: {
      isAnonymous: true,
      getIdToken() {
        return "anonymous";
      },
    },
    onAuthStateChanged() {
      return () => {};
    },
  } as never);
}

export async function loginAsNewTestUser() {
  const testUser = await createTestUser(context);
  const idToken = await makeFastchargeAPIIdTokenForUser({ user: testUser, expireInSeconds: 3600 });
  return jest.spyOn(firebaseModuleAuth, "getAuth").mockReturnValue({
    currentUser: {
      isAnonymous: true,
      getIdToken() {
        return idToken;
      },
    },
    onAuthStateChanged() {
      return () => {};
    },
  } as never);
}
