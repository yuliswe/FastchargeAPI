import type { RequestContext } from "@/src/RequestContext";
import { HttpMethod } from "@/src/__generated__/resolvers-types";
import type { EndpointCreateProps } from "@/src/database/models/Endpoint";
import { AppPK } from "@/src/pks/AppPK";
import { createTestApp } from "@/tests/test-data/App";

export async function createTestEndpoint(context: RequestContext, overwrites?: Partial<EndpointCreateProps>) {
  return context.batched.Endpoint.create({
    app: overwrites?.app ?? AppPK.stringify(await createTestApp(context)),
    method: HttpMethod.Get,
    path: "/test",
    destination: "http://example.com",
    ...overwrites,
  });
}
