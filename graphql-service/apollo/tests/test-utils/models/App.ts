import { RequestContext } from "@/RequestContext";
import { AppCreateProps } from "@/database/models/App";
import { UserPK } from "@/pks/UserPK";
import * as uuid from "uuid";
import { createTestUser } from "./User";

export async function createTestApp(context: RequestContext, overwrites?: Partial<AppCreateProps>) {
    return context.batched.App.create({
        name: `testapp-${uuid.v4()}`,
        owner: overwrites?.owner ?? UserPK.stringify(await createTestUser(context)),
    });
}
