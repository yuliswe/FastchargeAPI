const exampleSNSEventBodyMessage = {
    notificationType: "Received",
    mail: {
        timestamp: "2023-06-08T21:52:29.304Z",
        source: "ylilarry@gmail.com",
        messageId: "vjt5vh4b6is0t7bsi3vjooglhhmtjinuo3umuk81",
        destination: ["system@devfastchargeapi.com"],
        headersTruncated: false,
        headers: [
            {
                name: "Return-Path",
                value: "<ylilarry@gmail.com>",
            },
            {
                name: "Received",
                value: "from mail-yw1-f180.google.com (mail-yw1-f180.google.com [209.85.128.180]) by inbound-smtp.us-east-1.amazonaws.com with SMTP id vjt5vh4b6is0t7bsi3vjooglhhmtjinuo3umuk81 for system@devfastchargeapi.com; Thu, 08 Jun 2023 21:52:29 +0000 (UTC)",
            },
            {
                name: "X-SES-Spam-Verdict",
                value: "PASS",
            },
            {
                name: "X-SES-Virus-Verdict",
                value: "PASS",
            },
            {
                name: "Received-SPF",
                value: "pass (spfCheck: domain of _spf.google.com designates 209.85.128.180 as permitted sender) client-ip=209.85.128.180; envelope-from=ylilarry@gmail.com; helo=mail-yw1-f180.google.com;",
            },
            {
                name: "Authentication-Results",
                value: "amazonses.com; spf=pass (spfCheck: domain of _spf.google.com designates 209.85.128.180 as permitted sender) client-ip=209.85.128.180; envelope-from=ylilarry@gmail.com; helo=mail-yw1-f180.google.com; dkim=pass header.i=@gmail.com; dmarc=pass header.from=gmail.com;",
            },
            {
                name: "X-SES-RECEIPT",
                value: "AEFBQUFBQUFBQUFGa3k5YVJLYTFTT1Y3RU9yWlYwenhQSlErWE5VV21aTkkzNlpuK2VSTXFJcWI4N2F4eWovTGhZWnZXYlF4Q0RnY3BZQkVzS2NBQVo4U1IwZzN4NWREU3VOTlhBQ3FDdDBTMXRieWxvcUlSYS9mSTQ1aGtaam93WkZCMEwxSzZzYnlIUHFQbk94dXQvM1VvMC9nNzU5SG02dHBab2RsdGd1dGpsL0FFOHYvelhwUWJNbWRvMmRlNXJvdCtscVQzMXVYMThNeDR4VWI5eG1pRmlxSVU1NFU5VUFYeGI5TkFiZHNvRklFc0tZUndLOExyMWFlN3VNZzZJL2hYL2xnUWpZLzBvVlBTaWJMRnZwY0RYNkQ2dmExREd1dzYzUXMrdldVekFYb1RqQTJpYVE9PQ==",
            },
            {
                name: "X-SES-DKIM-SIGNATURE",
                value: "a=rsa-sha256; q=dns/txt; b=f6R5Z7s78/Gk2z+mN1ITzRil3wXseReo9TJtSzeZi7ahades9BNLWksvGgaQ3dH8uGPXJjccX7HkxUrnvMVDT3j98J7mRMcDx6BTAQBRp/NkUAQiUB/QOsJjDPGpcPK9ssGRPtlw5pWC+mX+3bGIfimoQb2AJkpsuhUd+naHG/g=; c=relaxed/simple; s=224i4yxa5dv7c2xz3womw6peuasteono; d=amazonses.com; t=1686261150; v=1; bh=WWOm7qY31pQm0CA8AUWmXsBeXaa60//XzjlopjZ03co=; h=From:To:Cc:Bcc:Subject:Date:Message-ID:MIME-Version:Content-Type:X-SES-RECEIPT;",
            },
            {
                name: "Received",
                value: "by mail-yw1-f180.google.com with SMTP id 00721157ae682-568ba7abc11so10213927b3.3 for <system@devfastchargeapi.com>; Thu, 08 Jun 2023 14:52:29 -0700 (PDT)",
            },
            {
                name: "DKIM-Signature",
                value: "v=1; a=rsa-sha256; c=relaxed/relaxed; d=gmail.com; s=20221208; t=1686261148; x=1688853148; h=to:subject:message-id:date:from:mime-version:from:to:cc:subject:date:message-id:reply-to; bh=WWOm7qY31pQm0CA8AUWmXsBeXaa60//XzjlopjZ03co=; b=c9EwoVOLmxBX/kqL6OY7NRCZJ2SDlj2UWkf/XSqQcsgFaHm7lF9XXB4rdV5av6l54b5ldko1EKGncRUVlpOLt/QGdFlNVps65+G6rkNHWbsgq9zIXxcFGOtoJLdXr3DnUIFm5CRgcz2caz+XSYBpZaWMYkRrsiPnBePZFzIVvfJy2s75bIqcr4+zCPx0twXm5tyGbGBJGLXCyuLJofVahO3WJd/avEf3UJ+e8TUmxiAdVNCQusOzHgqvkVfyVLoi696A20Rn0Ad6xSMk77RgarqNw+q7BgdNfFpLTDjBwfmZf80Ge23vb7n42wci30puyBah9sJAQAKZd6u9je9HFg==",
            },
            {
                name: "X-Google-DKIM-Signature",
                value: "v=1; a=rsa-sha256; c=relaxed/relaxed; d=1e100.net; s=20221208; t=1686261148; x=1688853148; h=to:subject:message-id:date:from:mime-version:x-gm-message-state :from:to:cc:subject:date:message-id:reply-to; bh=WWOm7qY31pQm0CA8AUWmXsBeXaa60//XzjlopjZ03co=; b=MPLq7T9ZnKJ2AEGRiosCdFmCLmkMm0PFg2PjyiXLIhllbLnhHCR0faKYO26mxR+Obg Om1JYS9Wdq6Sk272XmMkDAf0pdMwcY1KJpTwhNgBka+AF9WEObgPijxBFkBZb1jah1yd lni9cv+YJH9a1PDzLUk2ErVaXqrVVjJIxfQ39lgd8ZLYBhtmId4UGY4ndcdMzlkKRvmz jDrNI5Wb6zx8PVVgmK09A4ES/2FTdctuoXGMT2KDYfjJmn/dYk+/KC+Qnz3brjOvbkg/ zVHCnkicDqap9zbhZ7XPL4RjJaEezgs/ZRSRAS7TeyOmRn4FLnLGD6s0kQnrhYOohEJm vNxA==",
            },
            {
                name: "X-Gm-Message-State",
                value: "AC+VfDwH/gSXI6gIl8xp5MfLYDbyLsvYb16koy0tFdkp5Z+v/R/DEguI tXQTaDgbotXZZMByI6gLMZSefF03MJiUVrjs5FoSv80MNfFt+YH1",
            },
            {
                name: "X-Google-Smtp-Source",
                value: "ACHHUZ4I9UKGIhHcjRBh5LqSMwHWHHzMm60ZwyunNkdoohAhYWqejq7Mz3Ax0/vJw+04htB6UjPDDPstGigoHxmL44M=",
            },
            {
                name: "X-Received",
                value: "by 2002:a81:6dc3:0:b0:565:a8e7:239e with SMTP id i186-20020a816dc3000000b00565a8e7239emr937958ywc.23.1686261148498; Thu, 08 Jun 2023 14:52:28 -0700 (PDT)",
            },
            {
                name: "MIME-Version",
                value: "1.0",
            },
            {
                name: "From",
                value: "Yu Li <ylilarry@gmail.com>",
            },
            {
                name: "Date",
                value: "Thu, 8 Jun 2023 17:51:52 -0400",
            },
            {
                name: "Message-ID",
                value: "<CAJNKzfNfN0NowXmadorP8OAHuX=OXgJU=XFF7DR5mu4hw7Harg@mail.gmail.com>",
            },
            {
                name: "Subject",
                value: "Test Subject",
            },
            {
                name: "To",
                value: "system@devfastchargeapi.com",
            },
            {
                name: "Content-Type",
                value: 'multipart/alternative; boundary="000000000000c141e205fda544b1"',
            },
        ],
        commonHeaders: {
            returnPath: "ylilarry@gmail.com",
            from: ["Yu Li <ylilarry@gmail.com>"],
            date: "Thu, 8 Jun 2023 17:51:52 -0400",
            to: ["system@devfastchargeapi.com"],
            messageId: "<CAJNKzfNfN0NowXmadorP8OAHuX=OXgJU=XFF7DR5mu4hw7Harg@mail.gmail.com>",
            subject: "Test Subject",
        },
    },
    receipt: {
        timestamp: "2023-06-08T21:52:29.304Z",
        processingTimeMillis: 840,
        recipients: ["system@devfastchargeapi.com"],
        spamVerdict: {
            status: "PASS",
        },
        virusVerdict: {
            status: "PASS",
        },
        spfVerdict: {
            status: "PASS",
        },
        dkimVerdict: {
            status: "PASS",
        },
        dmarcVerdict: {
            status: "PASS",
        },
        action: {
            type: "SNS",
            topicArn: "arn:aws:sns:us-east-1:209991057786:dev-site-email-OnReceiveEmailAtMainDomainSNSTopic",
            encoding: "UTF8",
        },
    },
    content:
        'Return-Path: <ylilarry@gmail.com>\r\nReceived: from mail-yw1-f180.google.com (mail-yw1-f180.google.com [209.85.128.180])\r\n by inbound-smtp.us-east-1.amazonaws.com with SMTP id vjt5vh4b6is0t7bsi3vjooglhhmtjinuo3umuk81\r\n for system@devfastchargeapi.com;\r\n Thu, 08 Jun 2023 21:52:29 +0000 (UTC)\r\nX-SES-Spam-Verdict: PASS\r\nX-SES-Virus-Verdict: PASS\r\nReceived-SPF: pass (spfCheck: domain of _spf.google.com designates 209.85.128.180 as permitted sender) client-ip=209.85.128.180; envelope-from=ylilarry@gmail.com; helo=mail-yw1-f180.google.com;\r\nAuthentication-Results: amazonses.com;\r\n spf=pass (spfCheck: domain of _spf.google.com designates 209.85.128.180 as permitted sender) client-ip=209.85.128.180; envelope-from=ylilarry@gmail.com; helo=mail-yw1-f180.google.com;\r\n dkim=pass header.i=@gmail.com;\r\n dmarc=pass header.from=gmail.com;\r\nX-SES-RECEIPT: AEFBQUFBQUFBQUFGa3k5YVJLYTFTT1Y3RU9yWlYwenhQSlErWE5VV21aTkkzNlpuK2VSTXFJcWI4N2F4eWovTGhZWnZXYlF4Q0RnY3BZQkVzS2NBQVo4U1IwZzN4NWREU3VOTlhBQ3FDdDBTMXRieWxvcUlSYS9mSTQ1aGtaam93WkZCMEwxSzZzYnlIUHFQbk94dXQvM1VvMC9nNzU5SG02dHBab2RsdGd1dGpsL0FFOHYvelhwUWJNbWRvMmRlNXJvdCtscVQzMXVYMThNeDR4VWI5eG1pRmlxSVU1NFU5VUFYeGI5TkFiZHNvRklFc0tZUndLOExyMWFlN3VNZzZJL2hYL2xnUWpZLzBvVlBTaWJMRnZwY0RYNkQ2dmExREd1dzYzUXMrdldVekFYb1RqQTJpYVE9PQ==\r\nX-SES-DKIM-SIGNATURE: a=rsa-sha256; q=dns/txt; b=f6R5Z7s78/Gk2z+mN1ITzRil3wXseReo9TJtSzeZi7ahades9BNLWksvGgaQ3dH8uGPXJjccX7HkxUrnvMVDT3j98J7mRMcDx6BTAQBRp/NkUAQiUB/QOsJjDPGpcPK9ssGRPtlw5pWC+mX+3bGIfimoQb2AJkpsuhUd+naHG/g=; c=relaxed/simple; s=224i4yxa5dv7c2xz3womw6peuasteono; d=amazonses.com; t=1686261150; v=1; bh=WWOm7qY31pQm0CA8AUWmXsBeXaa60//XzjlopjZ03co=; h=From:To:Cc:Bcc:Subject:Date:Message-ID:MIME-Version:Content-Type:X-SES-RECEIPT;\r\nReceived: by mail-yw1-f180.google.com with SMTP id 00721157ae682-568ba7abc11so10213927b3.3\r\n        for <system@devfastchargeapi.com>; Thu, 08 Jun 2023 14:52:29 -0700 (PDT)\r\nDKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;\r\n        d=gmail.com; s=20221208; t=1686261148; x=1688853148;\r\n        h=to:subject:message-id:date:from:mime-version:from:to:cc:subject\r\n         :date:message-id:reply-to;\r\n        bh=WWOm7qY31pQm0CA8AUWmXsBeXaa60//XzjlopjZ03co=;\r\n        b=c9EwoVOLmxBX/kqL6OY7NRCZJ2SDlj2UWkf/XSqQcsgFaHm7lF9XXB4rdV5av6l54b\r\n         5ldko1EKGncRUVlpOLt/QGdFlNVps65+G6rkNHWbsgq9zIXxcFGOtoJLdXr3DnUIFm5C\r\n         Rgcz2caz+XSYBpZaWMYkRrsiPnBePZFzIVvfJy2s75bIqcr4+zCPx0twXm5tyGbGBJGL\r\n         XCyuLJofVahO3WJd/avEf3UJ+e8TUmxiAdVNCQusOzHgqvkVfyVLoi696A20Rn0Ad6xS\r\n         Mk77RgarqNw+q7BgdNfFpLTDjBwfmZf80Ge23vb7n42wci30puyBah9sJAQAKZd6u9je\r\n         9HFg==\r\nX-Google-DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;\r\n        d=1e100.net; s=20221208; t=1686261148; x=1688853148;\r\n        h=to:subject:message-id:date:from:mime-version:x-gm-message-state\r\n         :from:to:cc:subject:date:message-id:reply-to;\r\n        bh=WWOm7qY31pQm0CA8AUWmXsBeXaa60//XzjlopjZ03co=;\r\n        b=MPLq7T9ZnKJ2AEGRiosCdFmCLmkMm0PFg2PjyiXLIhllbLnhHCR0faKYO26mxR+Obg\r\n         Om1JYS9Wdq6Sk272XmMkDAf0pdMwcY1KJpTwhNgBka+AF9WEObgPijxBFkBZb1jah1yd\r\n         lni9cv+YJH9a1PDzLUk2ErVaXqrVVjJIxfQ39lgd8ZLYBhtmId4UGY4ndcdMzlkKRvmz\r\n         jDrNI5Wb6zx8PVVgmK09A4ES/2FTdctuoXGMT2KDYfjJmn/dYk+/KC+Qnz3brjOvbkg/\r\n         zVHCnkicDqap9zbhZ7XPL4RjJaEezgs/ZRSRAS7TeyOmRn4FLnLGD6s0kQnrhYOohEJm\r\n         vNxA==\r\nX-Gm-Message-State: AC+VfDwH/gSXI6gIl8xp5MfLYDbyLsvYb16koy0tFdkp5Z+v/R/DEguI\r\n\ttXQTaDgbotXZZMByI6gLMZSefF03MJiUVrjs5FoSv80MNfFt+YH1\r\nX-Google-Smtp-Source: ACHHUZ4I9UKGIhHcjRBh5LqSMwHWHHzMm60ZwyunNkdoohAhYWqejq7Mz3Ax0/vJw+04htB6UjPDDPstGigoHxmL44M=\r\nX-Received: by 2002:a81:6dc3:0:b0:565:a8e7:239e with SMTP id\r\n i186-20020a816dc3000000b00565a8e7239emr937958ywc.23.1686261148498; Thu, 08\r\n Jun 2023 14:52:28 -0700 (PDT)\r\nMIME-Version: 1.0\r\nFrom: Yu Li <ylilarry@gmail.com>\r\nDate: Thu, 8 Jun 2023 17:51:52 -0400\r\nMessage-ID: <CAJNKzfNfN0NowXmadorP8OAHuX=OXgJU=XFF7DR5mu4hw7Harg@mail.gmail.com>\r\nSubject: Test Subject\r\nTo: system@devfastchargeapi.com\r\nContent-Type: multipart/alternative; boundary="000000000000c141e205fda544b1"\r\n\r\n--000000000000c141e205fda544b1\r\nContent-Type: text/plain; charset="UTF-8"\r\n\r\nTest Content\r\n\r\n--000000000000c141e205fda544b1\r\nContent-Type: text/html; charset="UTF-8"\r\n\r\n<div dir="ltr">Test Content<br><div><br></div></div>\r\n\r\n--000000000000c141e205fda544b1--\r\n',
};

const exampleSNSEventBody = {
    Type: "Notification",
    MessageId: "379a1a19-b076-5906-8d29-46e5ffa8fa4c",
    TopicArn: "arn:aws:sns:us-east-1:209991057786:dev-site-email-OnReceiveEmailAtMainDomainSNSTopic",
    Subject: "Amazon SES Email Receipt Notification",
    Message: JSON.stringify(exampleSNSEventBodyMessage),
    Timestamp: "2023-06-08T21:52:30.167Z",
    SignatureVersion: "1",
    Signature:
        "qxJLEPOfU0K9LKg17TYPpg7TTltboxczawFbqRksUWNu/wyK+E8QTdoeeniIYTEHdwKFkOKP3/5Uc5SmiSsRWAIY7NlXp6iL2nVuPQV58upWoeohBSaDuBlrvq/xP9fwJcBf/1zCTJexLxCbAaxU4zpr9MZBWGTTmIo9Gioh3CTeGp+5X7zsimM2m/Jdp0KL2HDB9Y3CwiaLobGD4OQ/SWW6L88lFs00KGWnZTU5gJvg0G4NJQX3onwiLaNncDthM6ygPDz6im7vq7s9KxS8dszae+6kaiR0Z8epk9vNz+gfgEWgsGqXigbQZqys/BwnkVDHB2jfYqdPFtqaNBT1Dw==",
    SigningCertURL:
        "https://sns.us-east-1.amazonaws.com/SimpleNotificationService-01d088a6f77103d0fe307c0069e40ed6.pem",
    UnsubscribeURL:
        "https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-east-1:209991057786:dev-site-email-OnReceiveEmailAtMainDomainSNSTopic:6c66c591-f36c-4feb-8022-498f7d9c34ee",
};

export const exampleSNSEvent = {
    Records: [
        {
            messageId: "0dc2784b-310c-4cc3-9720-7cc63e50ded6",
            receiptHandle:
                "AQEBDRa1TvSP925yQHr42Kwl7t61h6+eoUlfHkCjpOCiBkDFGXvCqDYSo40xIN6ixrFHpKStB8jdIQZmmT2G158Jce7MeClzkAIxFxFtQ1UJVxEu4pF7rWrcN+Pm78eBUp7j5+ee9ISoLb0O+UBbZjt39QDOYjViRjRDRZZE0O219mW7FIPHhybQG/lakUOrnbeDrxfpDRDklUVTl2OaNsAHZPIcVcuYP4YOgkfwFMqSNBZ4SUGf7omU7OjDyobs4A/sI0IJw8E3IzWFq9moptU8pGxyOWgpE5du5Yztzj5ltRYz61avKWNBUlxS2rlIugqDLQV6e5PnUCV0hGrJk96RtAOUjkOQs6sqXgCrZYkCvcGleLH/fCbqZ9t7rqkXg177RwX5MpKLbBeVy63EUp5vuKIymhgY24i48bVjgbr82/oxq73kxGS4jRnsTaXQ+LaZ",
            body: JSON.stringify(exampleSNSEventBody),
            attributes: {
                ApproximateReceiveCount: "1",
                SentTimestamp: "1686261150206",
                SenderId: "AIDAIT2UOQQY3AUEKVGXU",
                ApproximateFirstReceiveTimestamp: "1686261150209",
            },
            messageAttributes: {},
            md5OfBody: "796052d8933a2e9322baaad09c853b0a",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:209991057786:dev-site-email-ForwardEmailSNSEventQueue-mKk2TXJotnsc",
            awsRegion: "us-east-1",
        },
    ],
};

export type SNSEvent = typeof exampleSNSEvent;
export type SNSEventBody = typeof exampleSNSEventBody;
export type SNSEventBodyMessage = typeof exampleSNSEventBodyMessage;
