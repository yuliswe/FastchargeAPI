import { baseDomain } from "@/src/runtime-config";
import Handlebars from "handlebars";
import paymentAcceptedEmailTemplate from "email-templates/payment-accepted.hbs";

export type PaymentAcceptedEmailTemplateProps = {
  userName: string;
  paymentAmount: string;
};

export function getPaymentAcceptedEmail(props: PaymentAcceptedEmailTemplateProps): string {
  const template = Handlebars.compile(paymentAcceptedEmailTemplate);
  return template({ ...props, loginLink: `https://${baseDomain}/account/` });
}
