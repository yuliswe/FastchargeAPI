import { UsageSummary } from "@/database/models";
import { RequestContext } from "../RequestContext";
import { AppPK } from "../pks/AppPK";
import { isCurrentUserPK } from "./utils";

export const UsageSummaryPermissions = {
    async viewUsageSummaryPrivateAttributes(
        parent: UsageSummary,
        context: RequestContext,
        { allowAppOwner = false }: { allowAppOwner?: boolean } = {}
    ): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        if (!context.currentUser) {
            return false;
        }
        if (allowAppOwner) {
            const app = await context.batched.App.get(AppPK.parse(parent.app));
            if (isCurrentUserPK(app.owner, context)) {
                return true;
            }
        }
        return isCurrentUserPK(parent.subscriber, context);
    },
    async listUsageSummaries({ subscriber }: { subscriber: string }, context: RequestContext): Promise<boolean> {
        if (context.isServiceRequest || context.isAdminUser) {
            return true;
        }
        return Promise.resolve(isCurrentUserPK(subscriber, context));
    },
};