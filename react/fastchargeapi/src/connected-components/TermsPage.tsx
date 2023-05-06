import React from "react";
import { RootAppState } from "../states/RootAppState";
import { connect } from "react-redux";
import { TermsAppState } from "../states/TermsAppState";
import { SiteLayout } from "../SiteLayout";
import { Box, Container, Grid, Stack, Typography } from "@mui/material";

type _State = {};

type _Props = {
    appState: TermsAppState;
};

class _TermsPage extends React.Component<_Props, _State> {
    constructor(props: _Props) {
        super(props);
        this.state = {};
    }
    render(): React.ReactNode {
        let titleWidth = 4;
        let contentWidth = 12 - titleWidth;
        return (
            <SiteLayout>
                <Container maxWidth="lg" sx={{ my: 10 }}>
                    <Grid container rowSpacing={10} columnSpacing={10}>
                        <Grid item xs={titleWidth}>
                            <Typography id="pricing" variant="h4" display="flex" flexDirection="row-reverse">
                                Pricing
                            </Typography>
                        </Grid>
                        <Grid item xs={contentWidth}>
                            <Stack spacing={3}>
                                <Typography variant="h5" gutterBottom>
                                    Using APIs published on FastchargeAPI
                                </Typography>
                                <Box>
                                    <Typography variant="body1" fontWeight={700} gutterBottom>
                                        Per-request fee & Monthly fee
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        When using an API that's published on FastchargeAPI, you pay the API publisher
                                        on a per-request basis. There might be a monthly fee that you pay to the API
                                        publisher while actively using their APIs. You only pay the monthly fee when the
                                        first request is made in every 30 days. In other words, if you don't make a
                                        request in 30 days, you are not charged the monthly fee, even if you are
                                        subscribed to an app.
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body1" fontWeight={700} gutterBottom>
                                        Free quota
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        Some API publishers may allow free quota so that you can try their APIs without
                                        paying. The free quota is per app and per account, and it does not reset
                                        monthly. Each request consumes 1 free quota. You won't be charged for the
                                        monthly fee when the free quota is used.
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body1" fontWeight={700} gutterBottom>
                                        Subscription
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        You must subscribe to a pricing plan of an app before using its APIs, including
                                        the free quota. If you are subscribed to an app and actively using it, and later
                                        switch to a subscription that has a higher monthly fee, you will be charged the
                                        difference between the two monthly fees for that active month. On the other
                                        hand, if you switch from a pricing plan that has a higher monthly fee to a
                                        pricing plan that has a lower monthly fee, the difference is not refunded. In
                                        both cases, the per-request fee on the new pricing plan is applied immediately.
                                        If you unsubscribe from an app, the monthly fee is not refunded if already paid.
                                        If you re-subscribe to the same plan during the same active month, that is,
                                        within 30 days from when the first request is billed the previous monthly fee,
                                        you won't be charged the monthly fee again. If you re-subscribe to a different
                                        plan, then it will be the same as if you are switching the plans.
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body1" fontWeight={700} gutterBottom>
                                        Account
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        All fees associated with API usage are charged to your FastchargeAPI account.
                                        You must maintain a positive account balance in order to use APIs. If your
                                        account balance is below zero, requests to any API will be rejected. You can top
                                        up your account at any time.{" "}
                                        <b>The balance on your account is not refundable. </b>
                                        You can, however, withdraw money from your account to your Stripe account. But
                                        keep in mind, doing so will incur a fee that's charged by Stripe. To find out
                                        more about this, see the pricing description for API publishers.
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body1" fontWeight={700} gutterBottom>
                                        Refund
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        <b>The balance on your account is not refundable. </b>
                                        If you are dissatisfied with our services or having trouble using an API you
                                        have paid the monthy fee for, please reach out to us and we will try to help
                                        you.
                                    </Typography>
                                </Box>

                                <Typography variant="h5" gutterBottom sx={{ pt: 5 }}>
                                    Publishing your APIs on FastchargeAPI
                                </Typography>
                                <Box>
                                    <Typography variant="body1" fontWeight={700} gutterBottom>
                                        Protection
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        Our pricing model is designed to protect you from unexpected bills and customer
                                        chargebacks, by requiring the customer to maintain a positive account balance.
                                        Charges are deducted from customers' account as API requests are made to your
                                        server. If the customer's account is insufficient, their requests will be
                                        automatically rejected by our system.
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body1" fontWeight={700} gutterBottom>
                                        Per-request & Monthly fee
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        You can set a per-request fee and a monthly fee for each app you publish on
                                        FastchargeAPI. The per-request fee is charged on successful requests to your
                                        APIs, and is made immediately available on your account balance after deducting
                                        FastchargeAPI's service fee. The monthly fee is paid by a customer every 30 days
                                        when they are actively using your API. If a customer has not used your API for
                                        30 days, they will not be charged the monthly fee, even if they remain
                                        subscribed to your app. Unlike the per-request fee, the monthly fee is made
                                        available to you at the end of the customer's 30-day billing period. During this
                                        period, the fee may show up in your account activities with a "pending" status.
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body1" fontWeight={700} gutterBottom>
                                        Offering Free Quota
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        Optionally, you can allow your customers to make a certain number of requests to
                                        your app without paying, by providing a pricing plan with free quota. The
                                        customer will only be billed after they have used up the free quota. The free
                                        quota is per app and per account, and it does not reset. Note that the
                                        Fastcharge API service fee is still charged on each request, even if the request
                                        is made with free quota.
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body1" fontWeight={700} gutterBottom>
                                        Responsibility
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        When a customer pays a monthly fee to use your app, you have a responsibility to
                                        provide uninterrupted service for 30 days. Failing to provide an uninterrupted
                                        service may result in a refund of the monthly fee to the customer.
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body1" fontWeight={700} gutterBottom>
                                        FastchargeAPI Service Fee
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        FastchargeAPI charges 0% of your monthly fee. We charge a service fee of $0.0001
                                        per request that's successfully made by your customer. This fee is deducted from
                                        your account immediately after the customer's request is made, and usually after
                                        the customer's per-request fee is deposited to your account.{" "}
                                        <b>
                                            If you offer free quota for an app, you still pay for the requests made by
                                            your customer.
                                        </b>{" "}
                                        It is important that your account maintains a positive balance. If your account
                                        is insufficient to cover the service fee, FastchargeAPI will reject all requests
                                        to your app. Given the pricing model, the safest way to ensure your account
                                        never runs into a negative balance is to set a per-request fee that's higher
                                        than the service fee, and offer no free quota. However, we hand the wheel to you
                                        to decide how to price your app.
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body1" fontWeight={700} gutterBottom>
                                        Getting Paid via Stripe
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        You can transfer money from your FastchargeAPI account to your Stripe account
                                        any time. The money transferred will appear in your Stripe account in 24 hours.
                                        We do not charge any fee for the transfers. However, 3rd-party payment
                                        processors, such as Stripe, do charge a fee for the transfer. At this time, the
                                        transfer fee associated with Stripe is $2.55 + 3.65% per transfer. This includes
                                        the fee occurred when the customer pays via Stripe to use your app, fee
                                        associated to collect tax via Stripe, and the fee when you withdraw money into
                                        your bank account. This also means that the minimum amount you can withdraw is
                                        $2.65. For example, if you withdraw $100.00, you will be charged $2.55 + 3.65%
                                        of $100.00 = $6.20, and you will receive $93.80.
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        FastchargeAPI is committed to making the percentage fee from your app's income
                                        as low as possible. In the future, we will provide other channels of payment so
                                        that the fee associated with transfers can be lowered.
                                    </Typography>
                                </Box>
                            </Stack>
                        </Grid>
                        <Grid item xs={titleWidth}>
                            <Typography id="privacy" variant="h4" display="flex" flexDirection="row-reverse">
                                Privacy
                            </Typography>
                        </Grid>
                        <Grid item xs={contentWidth}>
                            <Typography variant="h6">FastchargeAPI Gateway</Typography>
                            <Typography variant="body1" mt={2}>
                                API requests made via fastchargeapi.com are passed through the FastchargeAPI HTTP
                                Gateway. We take the privacy of our customers very seriously. We do not collect any
                                personal data other than what's necessary to provide the service, such as your email for
                                signing in our website. We do not share any personal data with any third party. Requests
                                made via our gateway is passed directly to the API provider, and the response is
                                directly passed back to the API caller. We do not view, store, cache, or log any data
                                from the request or the response. Your data is encrypted from the moment we receive the
                                request to when we sent back the response. We understand that sensitive information may
                                be included in the requests and the responses. If you have any concerns regarding to the
                                security of data, you are recommended to use application-level encryption. In the
                                future, we will support TCP proxy in our gateway so that you can utilize the security
                                provided by HTTPS.
                            </Typography>
                        </Grid>
                        <Grid item xs={titleWidth}>
                            <Typography id="tos" variant="h4" display="flex" flexDirection="row-reverse">
                                Terms of Service
                            </Typography>
                        </Grid>
                        <Grid item xs={contentWidth}>
                            <Typography variant="h6">Fastcharge API Terms of Service</Typography>
                            <Typography variant="body1" mt={2}>
                                These terms of service (these "Terms") apply to the services provided via
                                fastchargeapi.com (the "Site" or "Sites").
                            </Typography>
                            <Typography variant="body1" mt={2}>
                                By registering to use the Service, accessing the Service or providing access to any APIs
                                via the Service, you agree and acknowledge that you have read all of the terms and
                                conditions of these Terms, you understand all of the terms and conditions of these
                                Terms, and you agree to be legally bound by all of the terms and conditions of these
                                Terms.{" "}
                            </Typography>
                            <Typography variant="body1" mt={2}>
                                The "Effective Date" of these Terms is the date you first access the Service.
                                FastchargeAPI reserves the right to change or modify any of the terms and conditions
                                contained in these Terms (or any policy or guideline of FastchargeAPI) at any time and
                                in its sole discretion by providing notice that these Terms have been modified. Such
                                notice may be provided by sending an email, posting a notice on the Site, posting the
                                revised Terms on the Site and revising the date at the top of these Terms, or such other
                                form of notice as determined by FastchargeAPI. Any changes or modifications will be
                                effective 7 days after providing notice that these Terms have been modified (the "Notice
                                Period"). Your continued use of the Service following the Notice Period will constitute
                                your acceptance of such changes or modifications. You are advised to review these Terms
                                whenever you access the Service and at least every 30 days to make sure that you
                                understand the terms and conditions that will apply to your use of the Service.{" "}
                            </Typography>
                            <Typography variant="h6" mt={3}>
                                Registration
                            </Typography>
                            <Typography variant="body1" mt={2}>
                                In order to access the Service, API Providers and API Consumers must register with
                                FastchargeAPI by completing the registration forms provided via the Site. You agree to
                                (a) provide accurate, current, and complete information as may be prompted by the
                                registration forms via the Site ("Registration Data"), (b) maintain the security of your
                                FastchargeAPI account password, (c) maintain and promptly update the Registration Data,
                                and any other information you provide to FastchargeAPI, to keep it accurate, current,
                                and complete and (d) accept all risks of unauthorized access to the Registration Data
                                and any other information you provide to FastchargeAPI. You are responsible for
                                safeguarding the passwords you use to access the Service and agree to be fully
                                responsible for activities or transactions that relate to your FastchargeAPI account or
                                password. You must notify FastchargeAPI immediately if you learn of an unauthorized use
                                of your FastchargeAPI account or password.
                            </Typography>
                            <Typography variant="h6" mt={3}>
                                API Rights
                            </Typography>
                            <Typography variant="body1" mt={2}>
                                FastchargeAPI provides the API listing service, but the terms and conditions applicable
                                to the APIs (including, the use of the APIs) are between API Providers and API Consumers
                                (not FastchargeAPI). With respect to each API, API Consumers and the API Provider who
                                listed such API via the Service acknowledge and agree that the terms and conditions
                                applicable to the use of and other rights with respect to such API by each such API
                                Consumer are solely between each such API Consumer and such API Provider, and not with
                                FastchargeAPI. Each API Provider (not FastchargeAPI) is responsible for all support and
                                all claims relating thereto (e.g., product liability, legal compliance or intellectual
                                property infringement). FastchargeAPI reserves the right, but does not have the
                                obligation, to review, screen, or monitor any links to any APIs or any API Content/Terms
                                (as defined below) at any time and for any reason without notice. API Providers and API
                                Consumers acknowledge and agree that FastchargeAPI may remove any API or any API
                                Content/Terms at FastchargeAPI"s sole discretion.
                            </Typography>
                            <Typography variant="h6" mt={3}>
                                SUSPENSION OR TERMINATION
                            </Typography>
                            <Typography variant="body1" mt={2}>
                                FastchargeAPI may, at its sole discretion, suspend or terminate your license to access
                                or use the Service at any time and for any reason without notice. You must stop
                                accessing or using the Service immediately if FastchargeAPI suspends or terminates your
                                license to access or use the Service. FastchargeAPI reserves the right, but does not
                                undertake any duty, to take appropriate legal action including the pursuit of civil,
                                criminal, or injunctive redress against you for continuing to use the Service during
                                suspension or after termination. FastchargeAPI may recover its reasonable attorneys'
                                fees and court costs from you for such actions. These Terms will remain enforceable
                                against you while your license to access or use the Service is suspended and after it is
                                terminated. Except for the license granted to you to access and use the Service and all
                                payment terms, all of the terms, conditions, and restrictions set forth in these Terms
                                will survive the termination of these Terms. API Providers and API Consumers acknowledge
                                and agree that Fastcharge may remove any API or any API Content/Terms at Fastcharge's
                                sole discretion. API Consumer may terminate its subscription plan at any time by
                                selecting Unsubscribe from the applicable API plan page.
                            </Typography>
                            <Typography variant="h6" mt={3}>
                                DISCLAIMER
                            </Typography>
                            <Typography variant="body1" mt={2}>
                                YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK. THE SERVICE IS PROVIDED ON AN "AS IS" AND
                                "AS AVAILABLE" BASIS. FASTCHARGEAPI DISCLAIMS ALL WARRANTIES AND REPRESENTATIONS
                                (EXPRESS OR IMPLIED, ORAL OR WRITTEN) WITH RESPECT TO THESE TERMS, THE SERVICE, ANY OF
                                THE APIS PROVIDED VIA THE SERVICE, ANY API CONTENT/TERMS, ANY USER CONTENT, THE SITE
                                (INCLUDING ANY INFORMATION AND CONTENT MADE AVAILABLE VIA THE SITE AND THE FASTCHARGEAPI
                                MATERIALS), THIRD-PARTY INFRASTRUCTURE (AS DEFINED BELOW) AND THIRD-PARTY TRADEMARKS,
                                WHETHER ALLEGED TO ARISE BY OPERATION OF LAW, BY REASON OF CUSTOM OR USAGE IN THE TRADE,
                                BY COURSE OF DEALING OR OTHERWISE, INCLUDING ANY WARRANTIES OF MERCHANTABILITY, FITNESS
                                FOR ANY PURPOSE, NON-INFRINGEMENT, AND CONDITION OF TITLE. TO THE FULLEST EXTENT
                                PERMITTED BY APPLICABLE LAW, FASTCHARGEAPI DOES NOT WARRANT, AND DISCLAIMS ALL LIABILITY
                                FOR (A) THE COMPLETENESS, ACCURACY, AVAILABILITY, TIMELINESS, SECURITY, OR RELIABILITY
                                OF THE SERVICE, ANY OF THE APIS PROVIDED VIA THE SERVICE, ANY USER CONTENT, THE SITE
                                (INCLUDING ANY INFORMATION OR CONTENT MADE AVAILABLE VIA THE SITE), OR THIRD-PARTY
                                TRADEMARKS; (B) ANY HARM TO YOUR COMPUTER SYSTEM, LOSS OF DATA, OR OTHER HARM THAT
                                RESULTS FROM YOUR ACCESS TO OR USE OF THE SERVICE AND ANY API MADE AVAILABLE VIA THE
                                SERVICE; (C) THE DELETION OF, OR THE FAILURE TO STORE OR TRANSMIT, ANY USER CONTENT AND
                                OTHER COMMUNICATIONS MAINTAINED BY THE SERVICE; AND (D) WHETHER THE SERVICE WILL MEET
                                YOUR REQUIREMENTS OR BE AVAILABLE ON AN UNINTERRUPTED, SECURE, OR ERROR-FREE BASIS.
                            </Typography>
                            <Typography variant="h6" mt={3}>
                                INDEMNIFICATION
                            </Typography>
                            <Typography variant="body1" mt={2}>
                                You agree, at your sole expense, to defend, indemnify and hold FastchargeAPI (and its
                                directors, officers, employees, consultants and agents) harmless from and against any
                                and all actual or threatened suits, actions, proceedings (at law or in equity), claims,
                                damages, payments, deficiencies, fines, judgments, settlements, liabilities, losses,
                                costs and expenses (including, but not limited to, reasonable attorneys' fees, costs,
                                penalties, interest and disbursements) for any death, injury, property damage caused by,
                                arising out of, resulting from, attributable to or in any way incidental to any of your
                                conduct or any actual or alleged breach of any of your obligations under these Terms
                                (including, but not limited to, any actual or alleged breach of any of your
                                representations or warranties as set forth in these Terms).
                            </Typography>
                            <Typography variant="h6" mt={3}>
                                LIMITATION OF LIABILITY
                            </Typography>
                            <Typography variant="body1" mt={2}>
                                TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, FASTCHARGEAPI WILL NOT BE LIABLE TO
                                YOU OR ANY THIRD PARTY FOR ANY INCIDENTAL, SPECIAL, INDIRECT, CONSEQUENTIAL, EXEMPLARY,
                                OR PUNITIVE DAMAGES WHATSOEVER, ARISING OUT OF OR RELATED TO THESE TERMS, THE SERVICE,
                                ANY OF THE APIS PROVIDED VIA THE SERVICE, ANY API CONTENT/TERMS, ANY USER CONTENT, THE
                                SITE (INCLUDING ANY INFORMATION AND CONTENT MADE AVAILABLE VIA THE SITE AND
                                FASTCHARGEAPI MATERIALS), THIRD-PARTY INFRASTRUCTURE OR THIRD-PARTY TRADEMARKS, HOWEVER
                                CAUSED, REGARDLESS OF THE THEORY OF LIABILITY (CONTRACT, WARRANTY, TORT (INCLUDING
                                NEGLIGENCE, WHETHER ACTIVE, PASSIVE OR IMPUTED), PRODUCT LIABILITY, STRICT LIABILITY, OR
                                OTHER THEORY), EVEN IF FASTCHARGEAPI HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH
                                DAMAGES. IN NO EVENT SHALL THE AGGREGATE LIABILITY OF FASTCHARGEAPI ARISING OUT OF OR
                                RELATED TO THESE TERMS, THE SERVICE, ANY OF THE APIS PROVIDED VIA THE SERVICE, ANY API
                                CONTENT/TERMS, ANY USER CONTENT, THE SITE (INCLUDING ANY INFORMATION OR CONTENT MADE
                                AVAILABLE VIA THE SITE), THIRD-PARTY INFRASTRUCTURE OR THIRD-PARTY TRADEMARKS EXCEED ONE
                                HUNDRED U.S. DOLLARS (USD $100.00). SOME STATES DO NOT ALLOW THE EXCLUSION OR LIMITATION
                                OF INCIDENTAL OR CONSEQUENTIAL DAMAGES, SO THIS LIMITATION MAY NOT APPLY TO YOU.
                                FASTCHARGEAPI reserves the right, but does not have the obligation, to review, screen,
                                or monitor any links to any APIs or any API Content/Terms (as defined below) at any time
                                and for any reason without notice.
                            </Typography>
                        </Grid>
                    </Grid>
                </Container>
            </SiteLayout>
        );
    }
}

export const TermsPage = connect<_Props, {}, {}, RootAppState>((rootAppState: RootAppState) => ({
    appState: rootAppState.terms,
}))(_TermsPage);
