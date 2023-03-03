export type EndpointPKContent = {
    app: string;
    createdAt: number;
};

export class EndpointPK {
    static parse(pk: string): EndpointPKContent {
        let [app, createdAt] = JSON.parse(
            Buffer.from(pk.replace(/^endp_/, ""), "base64url").toString("utf8")
        );
        return {
            app,
            createdAt,
        };
    }

    static stringify(item: EndpointPKContent): string {
        return (
            "endp_" +
            Buffer.from(JSON.stringify([item.app, item.createdAt])).toString(
                "base64url"
            )
        );
    }
}
