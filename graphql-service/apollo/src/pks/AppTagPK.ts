import { PK } from "@/src/database/utils";

export type AppTagPKContent = {
  app: PK;
  tag: string;
};

export class AppTagPK {
  static parse(pk: PK): AppTagPKContent {
    const [app, tag] = JSON.parse(Buffer.from(pk.replace(/^apptag_/, ""), "base64url").toString("utf8")) as [
      string,
      string
    ];
    return {
      app,
      tag,
    };
  }

  static stringify({ app, tag }: AppTagPKContent): PK {
    return "apptag_" + Buffer.from(JSON.stringify([app, tag])).toString("base64url");
  }
}
