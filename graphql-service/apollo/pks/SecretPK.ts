export type SecretPKContent = {
    key: string;
};

export class SecretPK {
    static parse(pk: string): SecretPKContent {
        return {
            key: pk,
        };
    }

    static stringify({ key }: SecretPKContent): string {
        return key;
    }

    static extract({ key }: SecretPKContent): SecretPKContent {
        return { key };
    }
}
