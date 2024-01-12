import { RequestContext } from "@/RequestContext";
import { SiteMetaDataKey } from "@/__generated__/gql/graphql";
import { getSiteMetaDataOrDefault } from "@/functions/site";
import Decimal from "decimal.js-light";

export async function getRecivableAmountForWithdrawal(withdrawal: Decimal, context: RequestContext) {
  const stripeFeePercentage = new Decimal(
    (await getSiteMetaDataOrDefault(context, SiteMetaDataKey.StripePercentageFee)).value as string
  );
  const stripeFlatFee = new Decimal(
    (await getSiteMetaDataOrDefault(context, SiteMetaDataKey.StripeFlatFee)).value as string
  );
  const totalFee = stripeFlatFee.add(withdrawal.mul(stripeFeePercentage));
  const receivable = withdrawal.minus(totalFee);

  return { receivable, totalFee };
}
