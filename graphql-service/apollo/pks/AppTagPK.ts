export type AppTagPKContent = {
    app: string;
    tag: string;
};

export class AppTagPK {
    static parse(pk: string): AppTagPKContent {
        const [app, tag] = JSON.parse(Buffer.from(pk.replace(/^apptag_/, ""), "base64url").toString("utf8"));
        return {
            app,
            tag,
        };
    }

    static stringify({ app, tag }: AppTagPKContent): string {
        return "apptag_" + Buffer.from(JSON.stringify([app, tag])).toString("base64url");
    }
}
