import { baseDomain } from "graphql-service/runtime-config";
import Handlebars from "handlebars";
import paymentAcceptedEmailTemplate from "./payment-accepted.hbs";

export type PaymentAcceptedEmailTemplateProps = {
    userName: string;
    paymentAmount: string;
};

export function getPaymentAcceptedEmail(props: PaymentAcceptedEmailTemplateProps): string {
    const template = Handlebars.compile(paymentAcceptedEmailTemplate);
    return template({ ...props, loginLink: `https://${baseDomain}/account/` });
}
