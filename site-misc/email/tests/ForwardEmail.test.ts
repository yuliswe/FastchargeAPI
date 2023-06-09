import { describe, it } from "@jest/globals";
import { handle } from "lambda/ForwardEmail";
import type { Context } from "aws-lambda";
process.env.ForwardEmailTo = "devfastchargeapi@gmail.com";

const exampleEvent = {
    Records: [
        {
            EventSource: "aws:sns",
            EventVersion: "1.0",
            EventSubscriptionArn:
                "arn:aws:sns:us-east-1:209991057786:dev-site-email-OnReceiveEmailAtMainDomainSNSTopic:6467872c-4da2-48fc-a66b-ced44779465d",
            Sns: {
                Type: "Notification",
                MessageId: "e3f5be50-3725-5bb8-886d-e2ac44303293",
                TopicArn: "arn:aws:sns:us-east-1:209991057786:dev-site-email-OnReceiveEmailAtMainDomainSNSTopic",
                Subject: "Amazon SES Email Receipt Notification",
                Message:
                    '{"notificationType":"Received","mail":{"timestamp":"2023-06-09T00:22:45.046Z","source":"ylilarry@gmail.com","messageId":"tod62r09gmf8utmecan6cd3go4g991m52ljf9ig1","destination":["system@devfastchargeapi.com"],"headersTruncated":false,"headers":[{"name":"Return-Path","value":"<ylilarry@gmail.com>"},{"name":"Received","value":"from mail-yw1-f171.google.com (mail-yw1-f171.google.com [209.85.128.171]) by inbound-smtp.us-east-1.amazonaws.com with SMTP id tod62r09gmf8utmecan6cd3go4g991m52ljf9ig1 for system@devfastchargeapi.com; Fri, 09 Jun 2023 00:22:45 +0000 (UTC)"},{"name":"X-SES-Spam-Verdict","value":"PASS"},{"name":"X-SES-Virus-Verdict","value":"PASS"},{"name":"Received-SPF","value":"pass (spfCheck: domain of _spf.google.com designates 209.85.128.171 as permitted sender) client-ip=209.85.128.171; envelope-from=ylilarry@gmail.com; helo=mail-yw1-f171.google.com;"},{"name":"Authentication-Results","value":"amazonses.com; spf=pass (spfCheck: domain of _spf.google.com designates 209.85.128.171 as permitted sender) client-ip=209.85.128.171; envelope-from=ylilarry@gmail.com; helo=mail-yw1-f171.google.com; dkim=pass header.i=@gmail.com; dmarc=pass header.from=gmail.com;"},{"name":"X-SES-RECEIPT","value":"AEFBQUFBQUFBQUFHcDIzZVNMaHlSTGdyVTNwTjBTVFRJeVM0ekVxN1k2VHNWbnJjNDdUUEdsZUlSVk5FeDk3NktXekx0SmhsVjBGMjM1eisyRHpoSHdTLzhTWG95cW9wUDFaV0JZREk5eU9RdDg0VWR1d210N0kvUTV3YXd0S2t4dFU2R21BYVdQSUZZTlM2eWdFUk4yalg5emFOR0FtVlJwS1BaSHAwc0VESC9HbnYvUWlBSTBNQkxhb1lyWjc1eE9HMzF4YVBhQXJycTRkckdlYk5sVTZmR2IzWTlHcFowejZCR3ZLOHZ2QVAzUHZkcHh6a0lFR2xCL1FlbWFsZmhEZUJkbUM4MkEySXdOZlA1Rk1ibUhQV1huZjlTa3J4VllXQnBrRjJ0ZlpBMDlWcWcrUHEvaXc9PQ=="},{"name":"X-SES-DKIM-SIGNATURE","value":"a=rsa-sha256; q=dns/txt; b=Z8qtUnce9Ei2av6dsFT71nEKRbRIAkWmoITSzGMzz+hwvK5mcYAdFm/CzCwMCkrvjXW4Dct3A3p9AKLa1uBX4919JL5BUJGGXIWbizChkkeUPi8kAVbmDJhFJnkljQRj2asuPN2Tx8re1upzWWcHqaSC4ekZF4YltnjygY+OvuE=; c=relaxed/simple; s=224i4yxa5dv7c2xz3womw6peuasteono; d=amazonses.com; t=1686270165; v=1; bh=HDJdOm1EKXXtM3UnbKYgOUdjV2YxV2uufNKvDJJRnUM=; h=From:To:Cc:Bcc:Subject:Date:Message-ID:MIME-Version:Content-Type:X-SES-RECEIPT;"},{"name":"Received","value":"by mail-yw1-f171.google.com with SMTP id 00721157ae682-565a63087e9so11259007b3.2 for <system@devfastchargeapi.com>; Thu, 08 Jun 2023 17:22:44 -0700 (PDT)"},{"name":"DKIM-Signature","value":"v=1; a=rsa-sha256; c=relaxed/relaxed; d=gmail.com; s=20221208; t=1686270164; x=1688862164; h=to:subject:message-id:date:from:mime-version:from:to:cc:subject:date:message-id:reply-to; bh=HDJdOm1EKXXtM3UnbKYgOUdjV2YxV2uufNKvDJJRnUM=; b=cjuRndHxG/IeEgVeax1tcSpk4EljEmbK6MKTdY+KgswK1mn6FbwGFwmCL+X5/6wheBHJDoDIJq2C4hYcw6lSkmCOz0w/9OTCn2o4XEYIPXPUBiyIpD/991njXyRFf44WTb1t1PgRKDIfxIr39xZFFoDVHsNFdXd6fBtOfuXkvNr2AyxKw+cTkDU8lQ2eAqfRn2S0y0c6kWVdZqxQmgQDXqi3YT9iEzrxxKknfokrlxGuQD7te3TaYoT3orK+ZRZI0rShj37U5Bn4DNwAOvFplgKyBSqQVYbWA9Nn9T4d9In1Ui2m1hhy6x+XTXv1BXJBqSGkwNLrvy/xDTbwZcfvVg=="},{"name":"X-Google-DKIM-Signature","value":"v=1; a=rsa-sha256; c=relaxed/relaxed; d=1e100.net; s=20221208; t=1686270164; x=1688862164; h=to:subject:message-id:date:from:mime-version:x-gm-message-state :from:to:cc:subject:date:message-id:reply-to; bh=HDJdOm1EKXXtM3UnbKYgOUdjV2YxV2uufNKvDJJRnUM=; b=SMWVDJc7jp33wNZlJxMhi2khgzYZjuPXdZvSL1izP/EDPX8Q16qndnEQoJGnddubkF d5S6XJiEdouSoTe2J+5ZFR7qxJWvfS2VVP5allSVEDsX8rofWbWIoG/XEChFuSZLbZbW A/tlxhf0sgsMbpyHKauqjDjf8XZ2B3TIoXRehFtVdfISBCd+PA9ea5/LHmBTtsFQapjA 9fqSjXA0BG2ogVAsmkUVcreBMJmx6GhbrwZlWLBeZ3z02hI/1ONQZuQ6Zql6+QNNelV7 VRzJdZhdIkQJQ9I9qgTZC/M3TdD3azwbLPUuyqTpWN6FDmlLN2fJ34CYrs6vjxhPz0tU OnMg=="},{"name":"X-Gm-Message-State","value":"AC+VfDzHv7isqpGkawOEKRZX7rHJ7nYACM7ibNZXJ29G0H9GBy/pObo+ RlEyDCS6Q354iZUzisX7q2/nRtKZZBm2UjzxxrwwrDDqOvg0vL2W"},{"name":"X-Google-Smtp-Source","value":"ACHHUZ6qgDSks69YbEmBNo164f2CL1pIm4ZKPDW7USHyaHl+X98t5k1guouJQCL725uvytNC3P9W+C/v3x81DHbl0/w="},{"name":"X-Received","value":"by 2002:a81:bf49:0:b0:565:4218:15f9 with SMTP id s9-20020a81bf49000000b00565421815f9mr1221097ywk.25.1686270164209; Thu, 08 Jun 2023 17:22:44 -0700 (PDT)"},{"name":"MIME-Version","value":"1.0"},{"name":"From","value":"Yu Li <ylilarry@gmail.com>"},{"name":"Date","value":"Thu, 8 Jun 2023 20:22:08 -0400"},{"name":"Message-ID","value":"<CAJNKzfNNfA=xNygStCtwwwVrYo9sPDVuAXgy4Thfbn3s60Dnpg@mail.gmail.com>"},{"name":"Subject","value":"TestSubject"},{"name":"To","value":"system@devfastchargeapi.com"},{"name":"Content-Type","value":"multipart/alternative; boundary=\\"00000000000022153605fda75e54\\""}],"commonHeaders":{"returnPath":"ylilarry@gmail.com","from":["Yu Li <ylilarry@gmail.com>"],"date":"Thu, 8 Jun 2023 20:22:08 -0400","to":["system@devfastchargeapi.com"],"messageId":"<CAJNKzfNNfA=xNygStCtwwwVrYo9sPDVuAXgy4Thfbn3s60Dnpg@mail.gmail.com>","subject":"TestSubject"}},"receipt":{"timestamp":"2023-06-09T00:22:45.046Z","processingTimeMillis":583,"recipients":["system@devfastchargeapi.com"],"spamVerdict":{"status":"PASS"},"virusVerdict":{"status":"PASS"},"spfVerdict":{"status":"PASS"},"dkimVerdict":{"status":"PASS"},"dmarcVerdict":{"status":"PASS"},"action":{"type":"SNS","topicArn":"arn:aws:sns:us-east-1:209991057786:dev-site-email-OnReceiveEmailAtMainDomainSNSTopic","encoding":"UTF8"}},"content":"Return-Path: <ylilarry@gmail.com>\\r\\nReceived: from mail-yw1-f171.google.com (mail-yw1-f171.google.com [209.85.128.171])\\r\\n by inbound-smtp.us-east-1.amazonaws.com with SMTP id tod62r09gmf8utmecan6cd3go4g991m52ljf9ig1\\r\\n for system@devfastchargeapi.com;\\r\\n Fri, 09 Jun 2023 00:22:45 +0000 (UTC)\\r\\nX-SES-Spam-Verdict: PASS\\r\\nX-SES-Virus-Verdict: PASS\\r\\nReceived-SPF: pass (spfCheck: domain of _spf.google.com designates 209.85.128.171 as permitted sender) client-ip=209.85.128.171; envelope-from=ylilarry@gmail.com; helo=mail-yw1-f171.google.com;\\r\\nAuthentication-Results: amazonses.com;\\r\\n spf=pass (spfCheck: domain of _spf.google.com designates 209.85.128.171 as permitted sender) client-ip=209.85.128.171; envelope-from=ylilarry@gmail.com; helo=mail-yw1-f171.google.com;\\r\\n dkim=pass header.i=@gmail.com;\\r\\n dmarc=pass header.from=gmail.com;\\r\\nX-SES-RECEIPT: AEFBQUFBQUFBQUFHcDIzZVNMaHlSTGdyVTNwTjBTVFRJeVM0ekVxN1k2VHNWbnJjNDdUUEdsZUlSVk5FeDk3NktXekx0SmhsVjBGMjM1eisyRHpoSHdTLzhTWG95cW9wUDFaV0JZREk5eU9RdDg0VWR1d210N0kvUTV3YXd0S2t4dFU2R21BYVdQSUZZTlM2eWdFUk4yalg5emFOR0FtVlJwS1BaSHAwc0VESC9HbnYvUWlBSTBNQkxhb1lyWjc1eE9HMzF4YVBhQXJycTRkckdlYk5sVTZmR2IzWTlHcFowejZCR3ZLOHZ2QVAzUHZkcHh6a0lFR2xCL1FlbWFsZmhEZUJkbUM4MkEySXdOZlA1Rk1ibUhQV1huZjlTa3J4VllXQnBrRjJ0ZlpBMDlWcWcrUHEvaXc9PQ==\\r\\nX-SES-DKIM-SIGNATURE: a=rsa-sha256; q=dns/txt; b=Z8qtUnce9Ei2av6dsFT71nEKRbRIAkWmoITSzGMzz+hwvK5mcYAdFm/CzCwMCkrvjXW4Dct3A3p9AKLa1uBX4919JL5BUJGGXIWbizChkkeUPi8kAVbmDJhFJnkljQRj2asuPN2Tx8re1upzWWcHqaSC4ekZF4YltnjygY+OvuE=; c=relaxed/simple; s=224i4yxa5dv7c2xz3womw6peuasteono; d=amazonses.com; t=1686270165; v=1; bh=HDJdOm1EKXXtM3UnbKYgOUdjV2YxV2uufNKvDJJRnUM=; h=From:To:Cc:Bcc:Subject:Date:Message-ID:MIME-Version:Content-Type:X-SES-RECEIPT;\\r\\nReceived: by mail-yw1-f171.google.com with SMTP id 00721157ae682-565a63087e9so11259007b3.2\\r\\n        for <system@devfastchargeapi.com>; Thu, 08 Jun 2023 17:22:44 -0700 (PDT)\\r\\nDKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;\\r\\n        d=gmail.com; s=20221208; t=1686270164; x=1688862164;\\r\\n        h=to:subject:message-id:date:from:mime-version:from:to:cc:subject\\r\\n         :date:message-id:reply-to;\\r\\n        bh=HDJdOm1EKXXtM3UnbKYgOUdjV2YxV2uufNKvDJJRnUM=;\\r\\n        b=cjuRndHxG/IeEgVeax1tcSpk4EljEmbK6MKTdY+KgswK1mn6FbwGFwmCL+X5/6wheB\\r\\n         HJDoDIJq2C4hYcw6lSkmCOz0w/9OTCn2o4XEYIPXPUBiyIpD/991njXyRFf44WTb1t1P\\r\\n         gRKDIfxIr39xZFFoDVHsNFdXd6fBtOfuXkvNr2AyxKw+cTkDU8lQ2eAqfRn2S0y0c6kW\\r\\n         VdZqxQmgQDXqi3YT9iEzrxxKknfokrlxGuQD7te3TaYoT3orK+ZRZI0rShj37U5Bn4DN\\r\\n         wAOvFplgKyBSqQVYbWA9Nn9T4d9In1Ui2m1hhy6x+XTXv1BXJBqSGkwNLrvy/xDTbwZc\\r\\n         fvVg==\\r\\nX-Google-DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;\\r\\n        d=1e100.net; s=20221208; t=1686270164; x=1688862164;\\r\\n        h=to:subject:message-id:date:from:mime-version:x-gm-message-state\\r\\n         :from:to:cc:subject:date:message-id:reply-to;\\r\\n        bh=HDJdOm1EKXXtM3UnbKYgOUdjV2YxV2uufNKvDJJRnUM=;\\r\\n        b=SMWVDJc7jp33wNZlJxMhi2khgzYZjuPXdZvSL1izP/EDPX8Q16qndnEQoJGnddubkF\\r\\n         d5S6XJiEdouSoTe2J+5ZFR7qxJWvfS2VVP5allSVEDsX8rofWbWIoG/XEChFuSZLbZbW\\r\\n         A/tlxhf0sgsMbpyHKauqjDjf8XZ2B3TIoXRehFtVdfISBCd+PA9ea5/LHmBTtsFQapjA\\r\\n         9fqSjXA0BG2ogVAsmkUVcreBMJmx6GhbrwZlWLBeZ3z02hI/1ONQZuQ6Zql6+QNNelV7\\r\\n         VRzJdZhdIkQJQ9I9qgTZC/M3TdD3azwbLPUuyqTpWN6FDmlLN2fJ34CYrs6vjxhPz0tU\\r\\n         OnMg==\\r\\nX-Gm-Message-State: AC+VfDzHv7isqpGkawOEKRZX7rHJ7nYACM7ibNZXJ29G0H9GBy/pObo+\\r\\n\\tRlEyDCS6Q354iZUzisX7q2/nRtKZZBm2UjzxxrwwrDDqOvg0vL2W\\r\\nX-Google-Smtp-Source: ACHHUZ6qgDSks69YbEmBNo164f2CL1pIm4ZKPDW7USHyaHl+X98t5k1guouJQCL725uvytNC3P9W+C/v3x81DHbl0/w=\\r\\nX-Received: by 2002:a81:bf49:0:b0:565:4218:15f9 with SMTP id\\r\\n s9-20020a81bf49000000b00565421815f9mr1221097ywk.25.1686270164209; Thu, 08 Jun\\r\\n 2023 17:22:44 -0700 (PDT)\\r\\nMIME-Version: 1.0\\r\\nFrom: Yu Li <ylilarry@gmail.com>\\r\\nDate: Thu, 8 Jun 2023 20:22:08 -0400\\r\\nMessage-ID: <CAJNKzfNNfA=xNygStCtwwwVrYo9sPDVuAXgy4Thfbn3s60Dnpg@mail.gmail.com>\\r\\nSubject: TestSubject\\r\\nTo: system@devfastchargeapi.com\\r\\nContent-Type: multipart/alternative; boundary=\\"00000000000022153605fda75e54\\"\\r\\n\\r\\n--00000000000022153605fda75e54\\r\\nContent-Type: text/plain; charset=\\"UTF-8\\"\\r\\n\\r\\nTestContent\\r\\n\\r\\n--00000000000022153605fda75e54\\r\\nContent-Type: text/html; charset=\\"UTF-8\\"\\r\\n\\r\\n<div dir=\\"ltr\\">TestContent<br></div>\\r\\n\\r\\n--00000000000022153605fda75e54--\\r\\n"}',
                Timestamp: "2023-06-09T00:22:45.654Z",
                SignatureVersion: "1",
                Signature:
                    "hsfZIsCb0TDTuAPSmGWR7LX1FCxndi7S8L/wU4QNFiY2G4/NvvBKS43ufKDOin0RrNmCugBhWfK1kFLRcEmmqVY1s0EnN8fQxVw6FEaZmonPfkvAXhlsV92xR+IIHchlrbalRjABJajiMullWUCBWDaqJ8hY+yhZfTT0HQhrwmvGFrZYE3OT3JOK3Ra+1SVHSkFnHnTGyfLYfg4RyKIK5N0q48RQoL6YXfrjVJ6RZqLvEQaWhp/431WeIktlU++PLKpfHAuR25dyRlJktgRH6DZBxA9tdHY/f/tmRPd0xBZFUUybMlSxD2ZkKO8Ut0dkuSzzrzJOKzs8ZlX3k1j0fg==",
                SigningCertUrl:
                    "https://sns.us-east-1.amazonaws.com/SimpleNotificationService-01d088a6f77103d0fe307c0069e40ed6.pem",
                UnsubscribeUrl:
                    "https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-east-1:209991057786:dev-site-email-OnReceiveEmailAtMainDomainSNSTopic:6467872c-4da2-48fc-a66b-ced44779465d",
                MessageAttributes: {},
            },
        },
    ],
};

describe("ForwardEmail", () => {
    it("should be a function", async () => {
        await handle(exampleEvent as any, {} as Context, () => {
            return;
        });
    });
});