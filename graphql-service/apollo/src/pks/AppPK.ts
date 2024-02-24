import { PK } from "@/src/database/utils";

export type AppPKContent = {
  name: string;
};

export class AppPK {
  static parse(pk: PK): AppPKContent {
    return {
      name: pk,
    };
  }

  static stringify(item: AppPKContent): PK {
    return item.name;
  }

  static extract(item: AppPKContent): AppPKContent {
    return { name: item.name };
  }

  static guard(pk: string): PK {
    try {
      AppPK.parse(pk);
      return pk;
    } catch {
      throw new Error(`Invalid AppPK: ${pk}`);
    }
  }
}
