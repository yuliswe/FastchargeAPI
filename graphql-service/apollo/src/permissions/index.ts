import { AccountActivityPermissions } from "@/src/permissions/AccountActivity";
import { AccountHistoryPermissions } from "@/src/permissions/AcountHistory";
import { AppPermissions } from "@/src/permissions/App";
import { AppTagPermissions } from "@/src/permissions/AppTag";
import { EndpointPermissions } from "@/src/permissions/Endpoint";
import { PricingPermissions } from "@/src/permissions/Pricing";
import { SiteMetaDataPermissions } from "@/src/permissions/SiteMetaData";
import { StripePaymentAcceptPermissions } from "@/src/permissions/StripePaymentAccept";
import { StripeTransferPermissions } from "@/src/permissions/StripeTransfer";
import { SubscriptionPermissions } from "@/src/permissions/Subscription";
import { UsageLogPermissions } from "@/src/permissions/UsageLog";
import { UsageSummaryPermissions } from "@/src/permissions/UsageSummary";
import { UserPermissions } from "@/src/permissions/User";
import { UserAppTokenPermissions } from "@/src/permissions/UserAppToken";
import { OtherPermissions } from "@/src/permissions/permissions";

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
