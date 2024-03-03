import { PK } from "@/src/database/utils";

export type EndpointPKContent = {
  app: PK;
  rangeKey: string;
};

export class EndpointPK {
  static parse(pk: PK): EndpointPKContent {
    const [app, rangeKey] = JSON.parse(Buffer.from(pk.replace(/^endp_/, ""), "base64url").toString("utf8")) as [
      string,
      string
    ];
    return {
      app,
      rangeKey,
    };
  }

  static stringify(item: EndpointPKContent): PK {
    return "endp_" + Buffer.from(JSON.stringify([item.app, item.rangeKey])).toString("base64url");
  }
}
