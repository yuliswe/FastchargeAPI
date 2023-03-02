import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { TableClass } from "dynamoose/dist/Table/types";

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

export async function withDBLogging(context: () => Promise<void>) {
    let logger = await dynamoose.logger();
    logger.providers.set(console);
    await context();
    logger.providers.set(null);
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

const DEFAULT_FOR_CREATED_AT_RANGE_KEY = (async () => {
    await new Promise((resolve) => setTimeout(resolve, 1));
    return Date.now();
}) as any;

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

function String_Decimal(fieldName: string) {
    return {
        type: String,
        validate: (str: string) => {
            if (!/^-?\d+(\.\d+)?$/.test(str)) {
                throw new ValidationError(
                    fieldName,
                    `String must be a decimal number: "${str}"`
                );
            }
            return true;
        },
    };
}

const UserTableSchema = new dynamoose.Schema(
    {
        email: { type: String, hashKey: true },
        author: { type: String, default: "" },
        stripeCustomerId: { type: String, default: "" }, // Available after the user first tops up their account
        stripeConnectAccountId: { type: String, default: "" }, // Available after the user first onboards their Stripe account
        appTokens: { type: Object, default: {} },
    },
    {
        saveUnknown: ["appTokens.*"],
        timestamps: true,
    }
);

const AppTableSchema = new dynamoose.Schema(
    {
        name: { hashKey: true, ...String_Required_NotEmpty("name") },
        owner: { index: true, ...String_Required_NotEmpty("owner") },
        gatewayMode: {
            type: String,
            default: "proxy",
            validate: (str: string) => {
                if (str == null) {
                    return true;
                }
                if (!/proxy|redirect/.test(str)) {
                    throw new ValidationError(
                        "gatewayMode",
                        "Must be either 'proxy' or 'redirect'"
                    );
                }
                return true;
            },
        },
        description: { default: "", type: String },
    },
    { timestamps: true }
);

const EndpointTableSchema = new dynamoose.Schema(
    {
        app: { hashKey: true, ...String_Required_NotEmpty("app") },
        path: { rangeKey: true, ...String_Required_NotEmpty("path") },
        destination: { ...String_Required_NotEmpty("destination") },
        description: { default: "", type: String },
    },
    { timestamps: true }
);

const PricingTableSchema = new dynamoose.Schema(
    {
        app: { hashKey: true, ...String_Required_NotEmpty("app") },
        createdAt: { rangeKey: true, type: Number, default: () => Date.now() },
        name: { ...String_Required_NotEmpty("name") },
        callToAction: { type: String, default: "" },
        minMonthlyCharge: { type: String, default: "0" },
        chargePerRequest: { type: String, default: "0" },
        freeQuota: { type: Number, default: 0 },
        minMonthlyChargeApprox: Number,
        chargePerRequestApprox: Number,
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
            default: DEFAULT_FOR_CREATED_AT_RANGE_KEY,
        },
        app: { ...String_Required_NotEmpty("app") },
        status: {
            type: String,
            enum: ["pending", "collected"],
            default: "pending",
        },
        collectedAt: { type: Number, default: () => Date.now() },
        path: String_Required_NotEmpty("path"),
        volume: { type: Number, default: 1 },
        queuePosition: { type: Number, default: 0 },
        usageSummary: { type: String, required: false, default: undefined },
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
            default: DEFAULT_FOR_CREATED_AT_RANGE_KEY,
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
        queueSize: { type: Number, required: true },
        maxQueueSize: { type: Number, default: undefined },
        maxSecondsInQueue: { type: Number, default: undefined },
        billingAccountActivity: { type: String, default: undefined },
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
            default: DEFAULT_FOR_CREATED_AT_RANGE_KEY,
        },
        type: {
            type: String,
            required: true,
            enum: ["debit", "credit"],
        },
        reason: {
            type: String,
            required: true,
            validate: (str: string) =>
                [
                    "payout",
                    "topup",
                    "api_per_request_charge",
                    "api_min_monthly_charge",
                    "refund_api_min_monthly_charge",
                ].includes(str),
        },
        status: {
            type: String,
            enum: ["settled", "pending"],
            default: "pending",
        },
        settleAt: { type: Number, required: true },
        amount: { ...String_Decimal("amount"), required: true },
        usageSummary: { type: String, default: undefined },
        description: { type: String, default: "" },
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
            required: true,
            ...String_Decimal("startingBalance"),
        },
        closingBalance: { required: true, ...String_Decimal("closingBalance") },
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
        user: {
            hashKey: true,
            ...String_Required_NotEmpty("user"),
        },
        stripeSessionId: {
            index: true,
            ...String_Required_NotEmpty("stripeSessionId"),
        },
        createdAt: {
            type: Number,
            rangeKey: true,
            default: DEFAULT_FOR_CREATED_AT_RANGE_KEY,
        },
        amountCents: { type: Number, required: true },
        currency: { ...String_Required_NotEmpty("currency") },
        // @stripePaymentStatus: Do not check enum, as the source is stripe and
        // can change. Read the comment of the stripePaymentStatus field in the
        // StripePaymentAcceptTableSchema
        stripePaymentStatus: { ...String_Required_NotEmpty("status") },
        stripePaymentIntent: {
            ...String_Required_NotEmpty("stripePaymentIntent"),
        },
        stripeSessionObject: { type: Object, required: true },
        accountActivity: { type: String, required: false },
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
            default: DEFAULT_FOR_CREATED_AT_RANGE_KEY,
        },
        receiveCents: { type: Number, required: true },
        withdrawCents: { type: Number, required: true },
        currency: { ...String_Required_NotEmpty("currency") },
        stripeTransferId: {
            ...String_Required_NotEmpty("stripePaymentIntent"),
        },
        stripeTransferObject: { type: Object, required: true },
        accountActivity: { type: String, required: false },
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

/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.
export class App extends Item {
    name: string;
    owner: string;
    description: string;
    gatewayMode: GatewayMode;
}
/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.
export class Endpoint extends Item {
    app: string;
    path: string;
    destination: string;
    description: string;
}
/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.
export class User extends Item {
    email: string;
    author: string;
    balance: string;
    stripeCustomerId: string;
    stripeConnectAccountId: string;
    appTokens: { [appName: string]: string };
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
    subscriber: string; // Email of the user who made the API request
    app: string;
    path: string;
    createdAt: number;
    volume: number; // Number of requests. This is always 1 for now. Set to 2 for double rate charging.
    queuePosition: number; // Position in the queue before collection
    status: "pending" | "collected";
    collectedAt: number; // When the UsageSummary was created
    usageSummary: string | null; // ID of the UsageSummary item or null if not yet collected
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
    queueSize: number; // Number of usage logs in the queue when collected
    maxQueueSize: number | null; // Max queue size setting when collected, for debug purpose
    maxSecondsInQueue: number | null; // Max seconds in queue setting when collected, for debug purpose
    billingAccountActivity: string | null; // ID of the AccountActivity item or null if not yet billed
}
/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.
export class AccountActivity extends Item {
    user: string; // User who's account is affected
    type: "debit" | "credit";
    reason:
        | "payout"
        | "topup"
        | "api_per_request_charge"
        | "api_min_monthly_charge"
        | "refund_api_min_monthly_charge";
    status: "settled" | "pending";
    settleAt: number; // Unix timestamp when the activity is settled. Can be in the future.
    amount: string;
    usageSummary: string | null; // ID of the UsageSummary item or null if not related to usage
    accountHistory: string | null; // ID of the AccountHistory item or null if not related to account history
    createdAt: number;
    description: string;
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
 * event from Stripe. The only important fields are user and amountCents. The
 * rest are for debugging purpose.
 */
export class StripePaymentAccept extends Item {
    user: string;
    amountCents: number;
    createdAt: number;
    currency: string;
    stripePaymentStatus: "unpaid" | "paid" | "no_payment_required"; // This is copied from stripe checkout session's payment_status, for debugging purpose
    stripeSessionObject: object; // The entire stripe checkout session object, for debugging purpose
    stripePaymentIntent: string; // The stripe payment intent ID, copied from stripe checkout session's payment_intent
    stripeSessionId: string; // The stripe checkout session ID, copied from stripe checkout session object for debugging purpose
    accountActivity: string; // When the stripe payment is accepted, an account activity item is created
}
export class StripeTransfer extends Item {
    receiver: string;
    withdrawCents: number;
    receiveCents: number;
    currency: string;
    stripeTransferObject: object;
    stripeTransferId: string;
    createdAt: number;
    accountActivity: string;
}

export class Secret extends Item {
    key: string;
    value: string;
    description: string;
    expireAt: number;
    createdAt: number;
}

export const AppModel = dynamoose.model<App>("App", AppTableSchema, {
    ...tableConfigs,
});
export const EndpointModel = dynamoose.model<Endpoint>(
    "Endpoint",
    EndpointTableSchema,
    { ...tableConfigs }
);
export const UserModel = dynamoose.model<User>("User", UserTableSchema, {
    ...tableConfigs,
});
export const SubscriptionModel = dynamoose.model<Subscription>(
    "Subscription",
    SubscriptionTableSchema,
    { ...tableConfigs }
);
export const PricingModel = dynamoose.model<Pricing>(
    "Pricing",
    PricingTableSchema,
    { ...tableConfigs }
);
export const UsageLogModel = dynamoose.model<UsageLog>(
    "UsageLog",
    UsageLogTableSchema,
    { ...tableConfigs }
);
export const UsageSummaryModel = dynamoose.model<UsageSummary>(
    "UsageSummary",
    UsageSummaryTableSchema,
    { ...tableConfigs }
);
export const StripePaymentAcceptModel = dynamoose.model<StripePaymentAccept>(
    "StripePaymentAccept",
    StripePaymentAcceptTableSchema,
    { ...tableConfigs }
);
export const StripeTransferModel = dynamoose.model<StripeTransfer>(
    "StripeTransfer",
    StripeTransferTableSchema,
    { ...tableConfigs }
);
export const AccountHistoryModel = dynamoose.model<AccountHistory>(
    "AccountHistory",
    AccountHistoryTableSchema,
    { ...tableConfigs }
);
export const AccountActivityModel = dynamoose.model<AccountActivity>(
    "AccountActivity",
    AccountActivityTableSchema,
    { ...tableConfigs }
);
export const SecretModel = dynamoose.model<Secret>(
    "Secret",
    SecretTableSchema,
    { ...tableConfigs }
);
