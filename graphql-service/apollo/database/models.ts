import { GatewayMode, HttpMethod, PricingAvailability } from "@/__generated__/gql/graphql";
import { validateAppName } from "@/functions/app";
import dynamoose from "dynamoose";
import { ModelType } from "dynamoose/dist/General";
import { Item } from "dynamoose/dist/Item";
import { TableClass } from "dynamoose/dist/Table/types";
import {
    AccountActivityReason,
    AccountActivityStatus,
    AccountActivityType,
    SiteMetaDataKey,
    StripeTransferStatus,
    UsageLogStatus,
    UsageSummaryStatus,
} from "../__generated__/resolvers-types";

export const NULL = dynamoose.type.NULL;

if (process.env.DEV_DOMAIN === "1") {
    if (process.env.DISABLE_WARNINGS != "1") {
        console.warn("Using remote DEV database us-east-1");
    }
} else {
    console.warn("Using remote LIVE database us-east-1");
}

export async function enableDBLogging() {
    const logger = await dynamoose.logger();
    logger.providers.set(console);
}

export async function disableDBLogging() {
    const logger = await dynamoose.logger();
    logger.providers.set(null);
}

type Optional<T> = T | undefined | null;
export type GQLPartial<T> = { [K in keyof T]?: Optional<T[K]> };

const tableConfigs = {
    create: false,
    update: false, // do not set this to true. It will whipe the GSI.
    initialize: true,
    throughput: "ON_DEMAND" as const,
    prefix: process.env.DEV_DOMAIN === "1" ? "dev_restored_1686776400000_live_" : "live_",
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

export class ValidationError extends Error {
    constructor(public field: string, public message: string, public current: unknown) {
        super(`Validation faild on "${field}": ${message}.\nGot: ${JSON.stringify(current)}`);
    }
}

const defaultCreatedAt = (async () => {
    await new Promise((resolve) => setTimeout(resolve, 1));
    return Date.now();
}) as unknown as () => number;

const updatedAt = {
    updatedAt: {
        type: Number,
    },
};

function String_Required_NotEmpty(fieldName: string) {
    return {
        type: String,
        required: true,
        validate: (str: string) => {
            if (!/.+/.test(str)) {
                throw new ValidationError(fieldName, "String cannot be empty", str);
            }
            return true;
        },
    };
}

const validateStringDecimal = (fieldName: string) => (str: string) => {
    if (!/^-?\d+(\.\d+)?$/.test(str)) {
        throw new ValidationError(fieldName, `String must be a decimal number: "${str}"`, str);
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
        author: { type: String, default: () => `user_${Math.floor(Math.random() * 10000000)}` },
        stripeCustomerId: { type: String, required: false }, // Available after the user first tops up their account
        stripeConnectAccountId: { type: String, required: false }, // Available after the user first onboards their Stripe account
        balanceLimit: { type: String, default: "100", validate: validateStringDecimal("accountLimit") },
    },
    {
        timestamps: true,
    }
);

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

export type UserRequiredCreateProps = {
    uid: string;
    email: string;
} & GQLPartial<User>;

const AppTableSchema = new dynamoose.Schema(
    {
        name: {
            hashKey: true,
            type: String,
            required: true,
            validate: validateAppName,
        },
        owner: {
            type: String,
            required: true,
            index: {
                type: "global",
                name: "indexByOwner__onlyPK",
                project: ["name", "owner"],
            },
        },
        logo: { type: String },
        title: { type: String },
        gatewayMode: { type: String, default: "proxy", enum: ["proxy", "redirect"] },
        description: { type: String },
        repository: { type: String },
        homepage: { type: String },
        readme: { type: String },
        visibility: { type: String, default: "private", enum: ["public", "private"] },
    },
    { timestamps: true }
);

export enum AppTagTableIndex {
    indexByTag_app__onlyPK = "indexByTag_app__onlyPK",
}
export type AppVisibility = "public" | "private";
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
    readme: string;
    updatedAt: number;
    createdAt: number;
    visibility: AppVisibility;
    logo: string;
}

export type AppRequiredCreateProps = {
    name: string;
    owner: string;
} & GQLPartial<App>;

const AppTagTableSchema = new dynamoose.Schema(
    {
        app: { hashKey: true, ...String_Required_NotEmpty("app") },
        tag: {
            rangeKey: true,
            ...String_Required_NotEmpty("tag"),
            index: {
                type: "global",
                name: "indexByTag_app__onlyPK",
                project: ["tag", "app"],
            },
        },
    },
    { timestamps: true }
);

/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.
export class AppTag extends Item {
    app: string;
    tag: string;
    updatedAt: number;
    createdAt: number;
}

export type AppTagRequiredCreateProps = {
    app: string;
    tag: string;
} & GQLPartial<AppTag>;

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
            default: HttpMethod.Get,
            enum: Object.values(HttpMethod),
        },
        path: { ...String_Required_NotEmpty("path") },
        destination: { ...String_Required_NotEmpty("destination") },
        description: { type: String, default: "" },
    },
    {
        timestamps: {
            updatedAt,
        },
    }
);

/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.
export class Endpoint extends Item {
    app: string;
    path: string;
    method: HttpMethod;
    destination: string;
    description: string;
    createdAt: number;
    updatedAt: number;
}

export type EndpointRequiredCreateProps = {
    app: string;
    path: string;
    destination: string;
} & GQLPartial<Endpoint>;

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
        minMonthlyChargeFloat: Number,
        chargePerRequestFloat: Number,
        availability: {
            type: String,
            default: PricingAvailability.Public,
            enum: Object.values(PricingAvailability),
        },
    },
    {
        timestamps: {
            updatedAt,
        },
    }
);

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
    minMonthlyChargeFloat: number;
    chargePerRequestFloat: number;
    availability: PricingAvailability;
    updatedAt: number;
}

export type PricingRequiredCreateProps = {
    app: string;
    name: string;
} & GQLPartial<Pricing>;

const SubscriptionTableSchema = new dynamoose.Schema(
    {
        subscriber: {
            hashKey: true,
            ...String_Required_NotEmpty("subscriber"),
        },
        app: { rangeKey: true, ...String_Required_NotEmpty("app") },
        pricing: {
            ...String_Required_NotEmpty("pricing"),
            index: {
                type: "global",
                name: "indexByPricing_subscriber__onlyPK",
                project: ["pricing", "subscriber"],
            },
        },
    },
    { timestamps: true }
);

/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.
export class Subscription extends Item {
    subscriber: string;
    app: string;
    pricing: string;
    createdAt: number;
    updatedAt: number;
}

export type SubscriptionRequiredCreateProps = {
    subscriber: string;
    app: string;
    pricing: string;
} & GQLPartial<Subscription>;

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
            enum: Object.values(UsageLogStatus),
            default: UsageLogStatus.Pending,
        },
        collectedAt: { type: Number, required: false },
        path: String_Required_NotEmpty("path"),
        volume: { type: Number, default: 1 },
        usageSummary: { type: String, required: false, default: undefined },
        pricing: { type: String, required: true },
    },
    {
        timestamps: {
            updatedAt,
        },
    }
);

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
    status: UsageLogStatus;
    collectedAt: number; // When the UsageSummary was created
    usageSummary: string | null; // ID of the UsageSummary item or null if not yet collected
    pricing: string;
}

export type UsageLogRequiredCreateProps = {
    subscriber: string;
    app: string;
    path: string;
    pricing: string;
} & GQLPartial<UsageLog>;

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
    status: UsageSummaryStatus; // billed when account activities have been created
    billedAt: number | null;
    numberOfLogs: number; // Number of usage logs in the queue when collected
    billingRequestChargeAccountActivity: string | null; // ID of the AccountActivity item or null if not yet billed
    billingMonthlyChargeAccountActivity: string | null; // ID of the AccountActivity item or null if not yet billed
    appOwnerServiceFeeAccountActivity: string | null; // ID of the AccountActivity item or null if not yet billed
    appOwnerRequestChargeAccountActivity: string | null; // ID of the AccountActivity item or null if not yet billed
    appOwnerMonthlyChargeAccountActivity: string | null; // ID of the AccountActivity item or null if not yet billed
    pricing: string;
}

export type UsageSummaryRequiredCreateProps = {
    subscriber: string;
    app: string;
    pricing: string;
    path: string;
} & GQLPartial<UsageSummary>;

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
            enum: Object.values(UsageSummaryStatus),
            default: UsageSummaryStatus.Pending,
        },
        billedAt: { type: Number, default: undefined },
        numberOfLogs: { type: Number, required: true },
        billingRequestChargeAccountActivity: { type: String, default: undefined },
        billingMonthlyChargeAccountActivity: { type: String, default: undefined },
        appOwnerServiceFeeAccountActivity: { type: String, default: undefined },
        appOwnerRequestChargeAccountActivity: { type: String, default: undefined },
        appOwnerMonthlyChargeAccountActivity: { type: String, default: undefined },
        pricing: { type: String, required: true },
    },
    {
        timestamps: {
            updatedAt,
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
            enum: Object.values(AccountActivityType),
        },
        reason: {
            type: String,
            required: true,
            enum: Object.values(AccountActivityReason),
        },
        status: {
            type: String,
            index: {
                name: "indexByStatus_settleAt__onlyPK",
                rangeKey: "settleAt",
                type: "global",
                project: ["settleAt", "status"],
            },
            enum: Object.values(AccountActivityStatus),
            required: true,
            default: AccountActivityStatus.Pending,
        },
        settleAt: { type: Number, required: true },
        amount: {
            type: String,
            required: true,
            validate: validateStringDecimal("amount"),
        },
        usageSummary: { type: [String, NULL], required: false },
        stripeTransfer: { type: [String, NULL], required: false },
        stripePaymentAccept: { type: [String, NULL], required: false },
        description: { type: String, default: "" },
        billedApp: { type: [String, NULL], required: false },
        consumedFreeQuota: { type: [Number, NULL], required: false },
    },
    {
        timestamps: {
            updatedAt,
        },
    }
);

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
    type: AccountActivityType;
    reason: AccountActivityReason;
    status: AccountActivityStatus;
    settleAt: number; // Unix timestamp when the activity is settled. Can be in the future.
    amount: string;
    usageSummary: string | null; // ID of the UsageSummary item or null if not related to usage
    accountHistory: string | null; // ID of the AccountHistory item or null if not related to account history
    createdAt: number;
    description: string;
    stripeTransfer: string | null; // ID of the StripeTransfer item or null if not related to Stripe
    stripePaymentAccept: string | null; // ID of the StripePaymentAccept item or null if not related to Stripe
    billedApp: string | null; // ID of the App item if the activity is related to billing an app. This is the same as usageSummary.app
    consumedFreeQuota: number | null; // Number of free quota consumed by the subscriber when the activity is related to API usage. Usually this is the same as usageSummary.volume
}

export type AccountActivityRequiredCreateProps = {
    user: string;
    type: AccountActivityType;
    reason: AccountActivityReason;
    amount: string;
    settleAt: number;
} & GQLPartial<AccountActivity>;

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
        sequentialId: { required: true, type: Number },
    },
    {
        timestamps: {
            updatedAt,
        },
    }
);

/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.
export class AccountHistory extends Item {
    user: string;
    startingBalance: string;
    closingBalance: string;
    startingTime: number;
    closingTime: number;
    sequentialId: number;
}

export type AccountHistoryRequiredCreateProps = {
    user: string;
    startingTime: number;
    startingBalance: string;
    closingBalance: string;
    closingTime: number;
    sequentialId: number;
} & GQLPartial<AccountHistory>;

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
        status: { type: String, enum: ["pending", "settled", "expired"], required: false, default: "pending" },
    },
    {
        timestamps: {
            updatedAt,
        },
    }
);

/**
 * StripePaymentAccept represents an event when the user successfully pays over
 * the Stripe checkout session. StripePaymentAccept corresponds to an
 * AccountActivity which is created when the StripePaymentAccept object settles.
 * The The object is created by the payment-servce when it receives the webhook
 * event from Stripe.
 */
export class StripePaymentAccept extends Item {
    user: string;
    amount: string;
    createdAt: number;
    currency: string;
    status: "settled" | "pending" | "expired";
    stripePaymentStatus: string; // This is copied from stripe checkout session's payment_status, for debugging purpose
    stripeSessionObject: object; // The entire stripe checkout session object, for debugging purpose
    stripePaymentIntent: string; // The stripe payment intent ID, copied from stripe checkout session's payment_intent
    stripeSessionId: string; // The stripe checkout session ID, copied from stripe checkout session object for debugging purpose
    accountActivity: string; // When the stripe payment is accepted, an account activity item is created
}

export type StripePaymentAcceptRequiredCreateProps = {
    user: string;
    stripeSessionId: string;
    amount: string;
    stripePaymentStatus: string;
    stripePaymentIntent: string;
    stripeSessionObject: object;
} & GQLPartial<StripePaymentAccept>;

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
            enum: Object.values(StripeTransferStatus),
            required: true,
        },
    },
    {
        timestamps: {
            updatedAt,
        },
    }
);

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
    status: StripeTransferStatus;
}

export type StripeTransferRequiredCreateProps = {
    receiver: string;
    receiveAmount: string;
    withdrawAmount: string;
    transferAt: number;
    status: StripeTransferStatus;
} & GQLPartial<StripeTransfer>;

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

export class Secret extends Item {
    key: string;
    value: string;
    description: string;
    expireAt: number;
    createdAt: number;
}

export type SecretRequiredCreateProps = {
    key: string;
    value: string;
} & GQLPartial<Secret>;

const GatewayRequestCounterTableSchema = new dynamoose.Schema(
    {
        requester: { hashKey: true, type: String, required: true },
        app: { rangeKey: true, type: String, required: true },
        isGlobalCounter: { type: Boolean, default: false },
        counter: { type: Number, default: 0 },
        counterSinceLastReset: { type: Number, default: 0 },
        lastResetTime: { type: Number, default: 0 },
    },
    {
        timestamps: true,
    }
);

/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.

export class GatewayRequestCounter extends Item {
    requester: string;
    app: string | null;
    counter: number;
    counterSinceLastReset: number;
    lastResetTime: number;
    isGlobalCounter: boolean;
}

export type GatewayRequestCounterRequiredCreateProps = {
    requester: string;
    app: string;
} & GQLPartial<GatewayRequestCounter>;

const GatewayRequestDecisionCacheTableSchema = new dynamoose.Schema(
    {
        requester: { hashKey: true, type: String, required: true },
        app: { rangeKey: true, type: String, required: true },
        pricing: { type: String, required: false },
        useGlobalCounter: { type: Boolean, default: false },
        nextForcedBalanceCheckRequestCount: { type: Number, required: true },
        nextForcedBalanceCheckTime: { type: Number, required: true },
    },
    {
        timestamps: true,
    }
);

export class GatewayRequestDecisionCache extends Item {
    requester: string;
    app: string | null;
    pricing: string | null;
    useGlobalCounter: boolean;
    nextForcedBalanceCheckRequestCount: number;
    nextForcedBalanceCheckTime: number;
}

export type GatewayRequestDecisionCacheRequiredCreateProps = {
    requester: string;
    app: string;
    nextForcedBalanceCheckRequestCount: number;
    nextForcedBalanceCheckTime: number;
} & GQLPartial<GatewayRequestDecisionCache>;

const UserAppTokenTableSchema = new dynamoose.Schema(
    {
        subscriber: { hashKey: true, type: String, required: true },
        createdAt: {
            type: Number,
            rangeKey: true,
            default: defaultCreatedAt,
        },
        app: { type: String, required: true },
        signature: { type: String, required: true },
    },
    {
        timestamps: {
            updatedAt,
        },
    }
);

export class UserAppToken extends Item {
    subscriber: string;
    app: string;
    signature: string;
    createdAt: number;
    updatedAt: number;
    token: string | null;
}

export type UserAppTokenRequiredCreateProps = {
    subscriber: string;
    app: string;
    signature: string;
} & GQLPartial<UserAppToken>;

const FreeQuotaUsageTableSchema = new dynamoose.Schema(
    {
        subscriber: { hashKey: true, type: String, required: true },
        app: { rangeKey: true, type: String, required: true },
        usage: { type: Number, required: true, default: 0 },
    },
    { timestamps: true }
);

export class FreeQuotaUsage extends Item {
    subscriber: string;
    app: string;
    usage: number;
}

export type FreeQuotaUsageRequiredCreateProps = {
    subscriber: string;
    app: string;
} & GQLPartial<FreeQuotaUsage>;

const SiteMetaDataTableSchema = new dynamoose.Schema(
    {
        key: { hashKey: true, type: String, required: true },
        value: { type: [String, Boolean, Number], required: true },
    },
    {
        timestamps: true,
    }
);

export class SiteMetaData extends Item {
    key: SiteMetaDataKey;
    value: string;
}

export type SiteMetaDataRequiredCreateProps = {
    key: SiteMetaDataKey;
    value: string;
} & GQLPartial<SiteMetaData>;

export type Model<T extends Item> = ModelType<T>;
export { Item } from "dynamoose/dist/Item";

export const AppModel = dynamoose.model<App>("App", AppTableSchema, {
    ...tableConfigs,
});
export const AppTagModel = dynamoose.model<AppTag>("AppTag", AppTagTableSchema, {
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
export const FreeQuotaUsageModel = dynamoose.model<FreeQuotaUsage>("FreeQuotaUsage", FreeQuotaUsageTableSchema, {
    ...tableConfigs,
});
export const SiteMetaDataModel = dynamoose.model<SiteMetaData>("SiteMetaData", SiteMetaDataTableSchema, {
    ...tableConfigs,
});
