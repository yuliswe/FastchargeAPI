export type AppPKContent = {
    name: string;
};

export class AppPK {
    static parse(pk: string): AppPKContent {
        return {
            name: pk,
        };
    }

    static stringify(item: AppPKContent): string {
        return item.name;
    }
}
