import type { User } from "@/database/models/User";
import { PK } from "@/database/utils";

export type UserPKContent = {
  uid: string;
};

export class UserPK {
  static parse(pk: PK): UserPKContent {
    const uid = pk.replace(/^user_/, "");
    return {
      uid,
    };
  }

  static stringify(item: UserPKContent): PK {
    return "user_" + item.uid;
  }

  static guard(pk: PK): PK {
    try {
      UserPK.parse(pk);
      return pk;
    } catch {
      throw new Error(`Invalid User PK: ${pk}`);
    }
  }

  static isAdmin(user: User): boolean {
    return user.email === "fastchargeapi@gmail.com" || user.email === "devfastchargeapi@gmail.com";
  }
}
