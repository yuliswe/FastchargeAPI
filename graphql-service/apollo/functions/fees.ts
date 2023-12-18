import { RequestContext } from "@/RequestContext";
import { SiteMetaDataKey } from "@/__generated__/gql/graphql";
import Decimal from "decimal.js-light";

export async function getRecivableAmountForWithdrawal(withdrawal: Decimal, context: RequestContext) {
  const stripeFeePercentage = new Decimal(
    (await context.batched.SiteMetaData.get({ key: SiteMetaDataKey.StripePercentageFee })).value as string
  );
  const stripeFlatFee = new Decimal(
    (await context.batched.SiteMetaData.get({ key: SiteMetaDataKey.StripeFlatFee })).value as string
  );
  const totalStripe = stripeFlatFee.add(withdrawal.mul(stripeFeePercentage));
  const receivable = withdrawal.minus(totalStripe);

  return receivable;
}

export async function getMinWithdrawalAmount(context: RequestContext): Promise<Decimal> {
  const minWithdrawal = (await context.batched.SiteMetaData.get({ key: SiteMetaDataKey.MinWithdrawalAmount }))
    .value as string;
  return new Decimal(minWithdrawal);
}
