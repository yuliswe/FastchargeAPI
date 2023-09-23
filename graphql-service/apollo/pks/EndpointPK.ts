import { PK } from "@/database/utils";

export type EndpointPKContent = {
    app: string;
    createdAt: number;
};

export class EndpointPK {
    static parse(pk: PK): EndpointPKContent {
        const [app, createdAt] = JSON.parse(Buffer.from(pk.replace(/^endp_/, ""), "base64url").toString("utf8")) as [
            string,
            number
        ];
        return {
            app,
            createdAt,
        };
    }

    static stringify(item: EndpointPKContent): PK {
        return "endp_" + Buffer.from(JSON.stringify([item.app, item.createdAt])).toString("base64url");
    }
}
