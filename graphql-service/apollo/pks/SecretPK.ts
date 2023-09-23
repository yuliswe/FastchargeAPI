import { PK } from "@/database/utils";

export type SecretPKContent = {
    key: string;
};

export class SecretPK {
    static parse(pk: PK): SecretPKContent {
        return {
            key: pk,
        };
    }

    static stringify({ key }: SecretPKContent): PK {
        return key;
    }

    static extract({ key }: SecretPKContent): SecretPKContent {
        return { key };
    }
}
