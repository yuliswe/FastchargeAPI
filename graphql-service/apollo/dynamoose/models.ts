import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { TableClass } from "dynamoose/dist/Table/types";
import { isValidAppName } from "../functions/app";

let MAKE_TABLE = false;

if (process.env.TEST == "1") {
    // MAKE_TABLE = true;
    dynamoose.aws.ddb.local("http://localhost:9001/");
    console.warn("Using local database http://localhost:9001/");
} else {
    // Create new DynamoDB instance
    // const ddb = new dynamoose.aws.ddb.DynamoDB({
    //     region: "us-east-1",
    // });

    // // Set DynamoDB instance to the Dynamoose DDB instance
    // dynamoose.aws.ddb.set(ddb);
    console.warn("Using remote database us-east-1");
}

export async function enableDBLogging() {
    let logger = await dynamoose.logger();
    logger.providers.set(console);
}

export async function disableDBLogging() {
    let logger = await dynamoose.logger();
    logger.providers.set(null);
}

const tableConfigs = {
    create: MAKE_TABLE,
    update: false, // do not set this to true. It will whipe the GSI.
    initialize: true,
    throughput: "ON_DEMAND" as const,
    prefix: "dev__",
    suffix: "",
    waitForActive: {
        enabled: false,
        check: {
            timeout: 128_000,
            frequency: 1000,
        },
    },
    expires: undefined,
    tags: {},
    tableClass: TableClass.standard,
};

export enum GatewayMode {
    proxy = "proxy",
    redirect = "redirect",
}

class ValidationError {
    constructor(public field: string, public message: string) {}
    toString() {
        return `Validation faild on field "${this.field}": "${this.message}".`;
    }
}

const defaultCreatedAt = (async () => {
    await new Promise((resolve) => setTimeout(resolve, 1));
    return Date.now();
}) as unknown as () => number;

function String_Required_NotEmpty(fieldName: string) {
    return {
        type: String,
        required: true,
        validate: (str: string) => {
            if (!/.+/.test(str)) {
                throw new ValidationError(fieldName, "String cannot be empty");
            }
            return true;
        },
    };
}

const validateStringDecimal = (fieldName: string) => (str: string) => {
    if (!/^-?\d+(\.\d+)?$/.test(str)) {
        throw new ValidationError(fieldName, `String must be a decimal number: "${str}"`);
    }
    return true;
};

const UserTableSchema = new dynamoose.Schema(
    {
        uid: { type: String, hashKey: true },
        email: {
            type: String,
            required: true,
            index: {
                type: "global",
                name: "indexByEmail__onlyPK",
                project: ["uid"],
            },
        },
        author: { type: String, default: "" },
        stripeCustomerId: { type: String, required: false }, // Available after the user first tops up their account
        stripeConnectAccountId: { type: String, required: false }, // Available after the user first onboards their Stripe account
        balanceLimit: { type: String, default: "100", validate: validateStringDecimal("accountLimit") },
    },
    {
        timestamps: true,
    }
);

const AppTableSchema = new dynamoose.Schema(
    {
        name: { hashKey: true, type: String, required: true, validate: isValidAppName },
        owner: {
            type: String,
            required: true,
            index: {
                type: "global",
                name: "indexByOwner__onlyPK",
                project: ["name", "owner"],
            },
        },
        title: { type: String, required: false },
        gatewayMode: { type: String, default: "proxy", enum: ["proxy", "redirect"] },
        description: { default: "", type: String },
        repository: { default: "", type: String },
        homepage: { default: "", type: String },
    },
    { timestamps: true }
);

const EndpointTableSchema = new dynamoose.Schema(
    {
        app: { hashKey: true, ...String_Required_NotEmpty("app") },
        createdAt: {
            type: Number,
            rangeKey: true,
            default: defaultCreatedAt,
        },
        method: {
            type: String,
            default: "ANY",
            enum: ["ANY", "GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        },
        path: { ...String_Required_NotEmpty("path") },
        destination: { ...String_Required_NotEmpty("destination") },
        description: { type: String, default: "" },
    },
    {
        timestamps: {
            updatedAt: "updatedAt",
        },
    }
);

const PricingTableSchema = new dynamoose.Schema(
    {
        app: { hashKey: true, ...String_Required_NotEmpty("app") },
        createdAt: {
            rangeKey: true,
            type: Number,
            default: defaultCreatedAt,
        },
        name: { ...String_Required_NotEmpty("name") },
        callToAction: { type: String, default: "" },
        minMonthlyCharge: { type: String, default: "0" },
        chargePerRequest: { type: String, default: "0" },
        freeQuota: { type: Number, default: 0 },
        minMonthlyChargeApprox: Number,
        chargePerRequestApprox: Number,
        visible: { type: Boolean, default: false },
        mutable: { type: Boolean, default: true },
    },
    {
        timestamps: {
            updatedAt: "updatedAt",
        },
    }
);

const SubscriptionTableSchema = new dynamoose.Schema(
    {
        subscriber: {
            hashKey: true,
            ...String_Required_NotEmpty("subscriber"),
        },
        app: { rangeKey: true, ...String_Required_NotEmpty("app") },
        pricing: { ...String_Required_NotEmpty("pricing") },
    },
    { timestamps: true }
);

const UsageLogTableSchema = new dynamoose.Schema(
    {
        subscriber: {
            hashKey: true,
            ...String_Required_NotEmpty("subscriber"),
        },
        createdAt: {
            type: Number,
            rangeKey: true,
            default: defaultCreatedAt,
        },
        app: { ...String_Required_NotEmpty("app") },
        status: {
            type: String,
            enum: ["pending", "collected"],
            default: "pending",
        },
        collectedAt: { type: Number, required: false },
        path: String_Required_NotEmpty("path"),
        volume: { type: Number, default: 1 },
        usageSummary: { type: String, required: false, default: undefined },
        pricing: { type: String, required: true },
    },
    {
        timestamps: {
            updatedAt: "updatedAt",
        },
    }
);

const UsageSummaryTableSchema = new dynamoose.Schema(
    {
        subscriber: {
            hashKey: true,
            ...String_Required_NotEmpty("subscriber"),
        },
        createdAt: {
            type: Number,
            rangeKey: true,
            default: defaultCreatedAt,
        },
        app: {
            ...String_Required_NotEmpty("app"),
        },
        volume: { type: Number, default: 1 },
        status: {
            type: String,
            enum: ["pending", "billed"],
            default: "pending",
        },
        billedAt: { type: Number, default: undefined },
        numberOfLogs: { type: Number, required: true },
        billingAccountActivity: { type: String, default: undefined },
        pricing: { type: String, required: true },
    },
    {
        timestamps: {
            updatedAt: "updatedAt",
        },
    }
);

const AccountActivityTableSchema = new dynamoose.Schema(
    {
        user: { hashKey: true, ...String_Required_NotEmpty("user") },
        createdAt: {
            type: Number,
            rangeKey: true,
            default: defaultCreatedAt,
        },
        type: {
            type: String,
            required: true,
            enum: ["debit", "credit"],
        },
        reason: {
            type: String,
            required: true,
            enum: [
                "payout",
                "payout_fee",
                "topup",
                "api_per_request_charge",
                "api_min_monthly_charge",
                "api_min_monthly_charge_upgrade",
                "fastchargeapi_per_request_service_fee",
                "refund_api_min_monthly_charge",
            ],
        },
        status: {
            type: String,
            index: {
                name: "indexByStatus_settleAt__onlyPK",
                rangeKey: "settleAt",
                type: "global",
                project: ["settleAt", "status"],
            },
            enum: ["settled", "pending", "failed"],
            required: true,
            default: "pending",
        },
        settleAt: { type: Number, required: true },
        amount: {
            type: String,
            required: true,
            validate: validateStringDecimal("amount"),
        },
        usageSummary: { type: String, default: undefined },
        stripeTransfer: { type: String, default: undefined },
        stripePaymentAccept: { type: String, default: undefined },
        description: { type: String, default: "" },
        billedApp: { type: String, required: false, default: undefined },
    },
    {
        timestamps: {
            updatedAt: "updatedAt",
        },
    }
);

const AccountHistoryTableSchema = new dynamoose.Schema(
    {
        user: { hashKey: true, ...String_Required_NotEmpty("user") },
        startingTime: { type: Number, rangeKey: true, required: true },
        startingBalance: {
            type: String,
            required: true,
            validate: validateStringDecimal("startingBalance"),
        },
        closingBalance: {
            type: String,
            required: true,
            validate: validateStringDecimal("closingBalance"),
        },
        closingTime: { required: true, type: Number },
        sequentialID: { required: true, type: Number },
    },
    {
        timestamps: {
            updatedAt: "updatedAt",
        },
    }
);
const StripePaymentAcceptTableSchema = new dynamoose.Schema(
    {
        user: { type: String, hashKey: true, required: true },
        createdAt: { type: Number, rangeKey: true, default: defaultCreatedAt },
        stripeSessionId: { type: String, required: true },
        amount: {
            type: String,
            required: true,
            validate: validateStringDecimal("amount"),
        },
        currency: { type: String, required: false, default: "usd" },
        // @stripePaymentStatus: Do not check enum, as the source is stripe and
        // can change. Read the comment of the stripePaymentStatus field in the
        // StripePaymentAcceptTableSchema
        stripePaymentStatus: { ...String_Required_NotEmpty("status") },
        stripePaymentIntent: {
            ...String_Required_NotEmpty("stripePaymentIntent"),
        },
        stripeSessionObject: { type: Object, required: true },
        accountActivity: { type: String, required: false },
        status: { type: String, enum: ["pending", "settled"], required: false, default: "pending" },
    },
    {
        timestamps: {
            updatedAt: "updatedAt",
        },
    }
);

const StripeTransferTableSchema = new dynamoose.Schema(
    {
        receiver: {
            hashKey: true,
            ...String_Required_NotEmpty("receiver"),
        },
        createdAt: {
            type: Number,
            rangeKey: true,
            default: defaultCreatedAt,
        },
        receiveAmount: {
            type: String,
            required: true,
            validate: validateStringDecimal("receiveAmount"),
        },
        withdrawAmount: {
            type: String,
            required: true,
            validate: validateStringDecimal("withdrawAmount"),
        },
        currency: { ...String_Required_NotEmpty("currency") },
        stripeTransferId: { type: String, required: false },
        stripeTransferObject: { type: Object, required: false },
        accountActivity: { type: String, required: false },
        feeActivity: { type: String, required: false },
        transferAt: { type: Number, required: true },
        status: {
            type: String,
            index: {
                name: "indexByStatus_transferAt__onlyPK",
                rangeKey: "transferAt",
                type: "global",
                project: ["transferAt", "status"],
            },
            enum: ["pending", "transferred"],
            required: true,
        },
    },
    {
        timestamps: {
            updatedAt: "updatedAt",
        },
    }
);

const SecretTableSchema = new dynamoose.Schema(
    {
        key: {
            hashKey: true,
            ...String_Required_NotEmpty("key"),
        },
        value: { type: String, required: true },
        expireAt: { type: Number, required: false },
        description: { type: String, required: false }, // for debugging
    },
    {
        timestamps: true,
    }
);

const GatewayRequestCounterTableSchema = new dynamoose.Schema(
    {
        requester: { hashKey: true, type: String, required: true },
        app: { rangeKey: true, type: String, required: true },
        isGlobalCounter: { type: Boolean, required: true, default: false },
        counter: { type: Number, required: true, default: 0 },
        counterSinceLastReset: { type: Number, required: true, default: 0 },
        lastResetTime: { type: Number, required: true, default: 0 },
    },
    {
        timestamps: true,
    }
);

const GatewayRequestDecisionCacheTableSchema = new dynamoose.Schema(
    {
        requester: { hashKey: true, type: String, required: true },
        app: { rangeKey: true, type: String, required: true },
        pricing: { type: String, required: false },
        useGlobalCounter: { type: Boolean, required: true, default: false },
        nextForcedBalanceCheckRequestCount: { type: Number, required: true },
        nextForcedBalanceCheckTime: { type: Number, required: true },
    },
    {
        timestamps: true,
    }
);

const UserAppTokenTableSchema = new dynamoose.Schema(
    {
        subscriber: { hashKey: true, type: String, required: true },
        app: { type: String, required: true },
        signature: { type: String, required: true },
        createdAt: {
            type: Number,
            rangeKey: true,
            default: defaultCreatedAt,
        },
    },
    {
        timestamps: {
            updatedAt: "updatedAt",
        },
    }
);

/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.
export class App extends Item {
    name: string;
    owner: string;
    title: string;
    description: string;
    gatewayMode: GatewayMode;
    repository: string;
    homepage: string;
}
/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.
export class Endpoint extends Item {
    app: string;
    path: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS" | "ANY";
    destination: string;
    description: string;
    createdAt: number;
    updatedAt: number;
}
/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.
export class User extends Item {
    uid: string;
    email: string;
    author: string;
    balance: string;
    balanceLimit: string;
    stripeCustomerId: string | null;
    stripeConnectAccountId: string | null;
    appTokens: { [appName: string]: string };
    createdAt: number;
    updatedAt: number;
}

/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.
export class Pricing extends Item {
    app: string;
    createdAt: number;
    name: string;
    callToAction: string;
    minMonthlyCharge: string;
    chargePerRequest: string;
    freeQuota: number;
    minMonthlyChargeApprox: number;
    chargePerRequestApprox: number;
    visible: boolean;
    mutable: boolean;
}
/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.
export class Subscription extends Item {
    subscriber: string;
    app: string;
    pricing: string;
    createdAt: number;
    updatedAt: number;
}

/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.
/**
 * Represents a single API request access log. This is used to calculate the
 * billing. When user makes a request, a UsageLog item is created in a queue.
 * The server periodically collects the queue and creates UsageSummary items.
 */
export class UsageLog extends Item {
    subscriber: string; // User who made the API request
    app: string;
    path: string;
    createdAt: number;
    volume: number; // Number of requests. This is always 1 for now. Set to 2 for double rate charging.
    status: "pending" | "collected";
    collectedAt: number; // When the UsageSummary was created
    usageSummary: string | null; // ID of the UsageSummary item or null if not yet collected
    pricing: string;
}
/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.
/**
 * Represents a summary of API request access logs. This is used to calculate
 * the billing. Each UsageSummary item represents a single billing period and
 * can be billed to create AccountActivity item.
 */
export class UsageSummary extends Item {
    app: string;
    subscriber: string;
    volume: number;
    createdAt: number;
    status: "pending" | "billed"; // billed when account activities have been created
    billedAt: number | null;
    numberOfLogs: number; // Number of usage logs in the queue when collected
    billingAccountActivity: string | null; // ID of the AccountActivity item or null if not yet billed
    pricing: string;
}

/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.
/**
 * Records a single account activity.
 *
 * @settleAt We use the word "settle" to mean the activity is reflected in the
 * user's balance. The time can be in the past or in the future. If the time is
 * in the future, for example, when depositing to the user's balance, we might
 * want to hold the money for a period of time, then at somepoint the
 * AccountActivity should be settled in the future, just not now.
 */
export class AccountActivity extends Item {
    user: string; // User who's account is affected
    type: "debit" | "credit";
    reason:
        | "payout"
        | "payout_fee"
        | "topup"
        | "api_per_request_charge"
        | "api_min_monthly_charge"
        | "api_min_monthly_charge_upgrade"
        | "fastchargeapi_per_request_service_fee"
        | "refund_api_min_monthly_charge";
    status: "settled" | "pending";
    settleAt: number; // Unix timestamp when the activity is settled. Can be in the future.
    amount: string;
    usageSummary: string | null; // ID of the UsageSummary item or null if not related to usage
    accountHistory: string | null; // ID of the AccountHistory item or null if not related to account history
    createdAt: number;
    description: string;
    stripeTransfer: string | null; // ID of the StripeTransfer item or null if not related to Stripe
    stripePaymentAccept: string | null; // ID of the StripePaymentAccept item or null if not related to Stripe
    billedApp: string | null; // ID of the App item if the activity is related to billing an app. This is the same as usageSummary.app
}
/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.
export class AccountHistory extends Item {
    user: string;
    startingBalance: string;
    closingBalance: string;
    startingTime: number;
    closingTime: number;
    sequentialID: number;
}

/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.

/**
 * StripePaymentAccept represents an event when the user successfully pays over
 * the Stripe checkout session. StripePaymentAccept corresponds to an
 * AccountActivity which is created when the StripePaymentAccept object settles.
 * The The object is created by the payment-servce when it receives the webhook
 * event from Stripe. The only important fields are user and amount. The rest
 * are for debugging purpose.
 */
export class StripePaymentAccept extends Item {
    user: string;
    amount: string;
    createdAt: number;
    currency: string;
    status: "settled" | "pending";
    stripePaymentStatus: "unpaid" | "paid" | "no_payment_required"; // This is copied from stripe checkout session's payment_status, for debugging purpose
    stripeSessionObject: object; // The entire stripe checkout session object, for debugging purpose
    stripePaymentIntent: string; // The stripe payment intent ID, copied from stripe checkout session's payment_intent
    stripeSessionId: string; // The stripe checkout session ID, copied from stripe checkout session object for debugging purpose
    accountActivity: string; // When the stripe payment is accepted, an account activity item is created
}

/**
 * StripeTransfer represents an event when the user withdraw money to their
 * Stripe account.
 *
 * @accountActivity The ID of the AccountActivity item which represents the
 * amount the user will receive.
 *
 * @feeActivity The ID of the AccountActivity item which represents the fee that
 * the user pays us.
 *
 * @transferAt The time when the transfer is actually moved out of our account.
 * The time can be in the future or in the past. If the time is in the future,
 * then at some point the money will be transferred in the future, by a cron
 * job.
 */
export class StripeTransfer extends Item {
    receiver: string;
    withdrawAmount: string;
    receiveAmount: string;
    currency: string;
    stripeTransferObject: object | null;
    stripeTransferId: string | null;
    createdAt: number;
    accountActivity: string;
    feeActivity: string;
    transferAt: number;
    status: "pending" | "transferred" | "failed";
}

export class Secret extends Item {
    key: string;
    value: string;
    description: string;
    expireAt: number;
    createdAt: number;
}

export class GatewayRequestCounter extends Item {
    requester: string;
    app: string | null;
    counter: number;
    counterSinceLastReset: number;
    lastResetTime: number;
    isGlobalCounter: boolean;
}

export class GatewayRequestDecisionCache extends Item {
    requester: string;
    app: string | null;
    pricing: string | null;
    useGlobalCounter: boolean;
    nextForcedBalanceCheckRequestCount: number;
    nextForcedBalanceCheckTime: number;
}

export class UserAppToken extends Item {
    subscriber: string;
    app: string;
    signature: string;
    createdAt: number;
    updatedAt: number;
    token: string | null;
}

export const AppModel = dynamoose.model<App>("App", AppTableSchema, {
    ...tableConfigs,
});
export const EndpointModel = dynamoose.model<Endpoint>("Endpoint", EndpointTableSchema, { ...tableConfigs });
export const UserModel = dynamoose.model<User>("User", UserTableSchema, {
    ...tableConfigs,
});
export const SubscriptionModel = dynamoose.model<Subscription>("Subscription", SubscriptionTableSchema, {
    ...tableConfigs,
});
export const PricingModel = dynamoose.model<Pricing>("Pricing", PricingTableSchema, { ...tableConfigs });
export const UsageLogModel = dynamoose.model<UsageLog>("UsageLog", UsageLogTableSchema, { ...tableConfigs });
export const UsageSummaryModel = dynamoose.model<UsageSummary>("UsageSummary", UsageSummaryTableSchema, {
    ...tableConfigs,
});
export const StripePaymentAcceptModel = dynamoose.model<StripePaymentAccept>(
    "StripePaymentAccept",
    StripePaymentAcceptTableSchema,
    { ...tableConfigs }
);
export const StripeTransferModel = dynamoose.model<StripeTransfer>("StripeTransfer", StripeTransferTableSchema, {
    ...tableConfigs,
});
export const AccountHistoryModel = dynamoose.model<AccountHistory>("AccountHistory", AccountHistoryTableSchema, {
    ...tableConfigs,
});
export const AccountActivityModel = dynamoose.model<AccountActivity>("AccountActivity", AccountActivityTableSchema, {
    ...tableConfigs,
});
export const SecretModel = dynamoose.model<Secret>("Secret", SecretTableSchema, { ...tableConfigs });
export const GatewayRequestCounterModel = dynamoose.model<GatewayRequestCounter>(
    "GatewayRequestCounter",
    GatewayRequestCounterTableSchema,
    { ...tableConfigs }
);
export const GatewayRequestDecisionCacheModel = dynamoose.model<GatewayRequestDecisionCache>(
    "GatewayRequestDecisionCache",
    GatewayRequestDecisionCacheTableSchema,
    { ...tableConfigs }
);
export const UserAppTokenModel = dynamoose.model<UserAppToken>("UserAppToken", UserAppTokenTableSchema, {
    ...tableConfigs,
});
