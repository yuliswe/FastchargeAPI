import { AccountActivityPermissions } from "./AccountActivity";
import { AccountHistoryPermissions } from "./AcountHistory";
import { AppPermissions } from "./App";
import { AppTagPermissions } from "./AppTag";
import { EndpointPermissions } from "./Endpoint";
import { PricingPermissions } from "./Pricing";
import { SiteMetaDataPermissions } from "./SiteMetaData";
import { StripePaymentAcceptPermissions } from "./StripePaymentAccept";
import { StripeTransferPermissions } from "./StripeTransfer";
import { SubscriptionPermissions } from "./Subscription";
import { UsageLogPermissions } from "./UsageLog";
import { UsageSummaryPermissions } from "./UsageSummary";
import { UserPermissions } from "./User";
import { UserAppTokenPermissions } from "./UserAppToken";
import { OtherPermissions } from "./permissions";

export const Can = {
    ...OtherPermissions,
    ...UserPermissions,
    ...AccountActivityPermissions,
    ...PricingPermissions,
    ...AccountHistoryPermissions,
    ...SiteMetaDataPermissions,
    ...UsageLogPermissions,
    ...StripePaymentAcceptPermissions,
    ...StripeTransferPermissions,
    ...EndpointPermissions,
    ...SubscriptionPermissions,
    ...UserAppTokenPermissions,
    ...AppPermissions,
    ...AppTagPermissions,
    ...AppTagPermissions,
    ...UsageSummaryPermissions,
};
