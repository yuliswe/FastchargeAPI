export type StripeTransferPKContent = {
    receiver: string;
    createdAt: number;
};

export class StripeTransferPK {
    static parse(pk: string): StripeTransferPKContent {
        const [receiver, createdAt] = JSON.parse(Buffer.from(pk.replace(/^stran_/, ""), "base64url").toString("utf8"));
        return {
            receiver,
            createdAt,
        };
    }

    static stringify(item: StripeTransferPKContent): string {
        return "stran_" + Buffer.from(JSON.stringify([item.receiver, item.createdAt])).toString("base64url");
    }

    static extract(item: StripeTransferPKContent): StripeTransferPKContent {
        return {
            receiver: item.receiver,
            createdAt: item.createdAt,
        };
    }
}
