import dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { TableClass } from "dynamoose/dist/Table/types";

let MAKE_TABLE = false;

if (process.env.TEST == "1") {
    MAKE_TABLE = true;
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

const tableConfigs = {
    create: MAKE_TABLE,
    update: MAKE_TABLE,
    initialize: true,
    throughput: "ON_DEMAND" as const,
    prefix: "dev__",
    suffix: "",
    waitForActive: {
        enabled: MAKE_TABLE,
        check: {
            timeout: 128_000,
            frequency: 1000,
        },
    },
    expires: null,
    tags: {},
    tableClass: TableClass.standard,
};

// declare module "dynamoose/dist/Model" {
//     interface Model<T> {
//         put(item: Partial<T>): Promise<T>
//         partialUpdate(item: Partial<T>): Promise<T>
//     }
// }

// function removeUndefinedKeys<T>(object: T) {
//     let data: Partial<T> = {}
//     for (let [key, val] of Object.entries(object)) {
//         if (val !== undefined) {
//             data[key] = val as keyof T;
//         }
//     }
//     return data
// }

// export function addMethods<T extends Item>(model: Model<T>) {
//     model.methods.set("put", async function (item: Partial<T>): Promise<T> {
//         // Need to remove properties that are actually undefined
//         const keyName = model.table().hashKey;
//         let data: Partial<T> = removeUndefinedKeys(item)
//         try {
//             await model.get(item[keyName] as string);
//             return await model.update(data);
//         } catch (e) {
//             return await model.create(data);
//         }
//     });

//     model.methods.set("partialUpdate", async function (data: T): Promise<T> {
//         const keyName = model.table().hashKey;
//         let original = await model.get(data[keyName] as string);
//         original = Object.assign(original, data);
//         return await original.save() as T
//     });
// }
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

const String_REQUIRED_NON_EMPTY = {
    type: String,
    required: true,
    validate: (str: string) => {
        if (!/.+/.test(str)) {
            throw new ValidationError(null, "String cannot be empty");
        }
        return true;
    },
};

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
            if (!/^\d+(\.\d+)?$/.test(str)) {
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
        balance: { ...String_Decimal("balance"), default: "0" },
        stripeCustomerId: { type: String, default: "" }, // Available after the user first tops up their account
        stripeConnectAccountId: { type: String, default: "" }, // Available after the user first onboards their Stripe account
    },
    { timestamps: true }
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

const SubscribeTableSchema = new dynamoose.Schema(
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
        createdAt: { type: Number, rangeKey: true, default: () => Date.now() },
        app: { index: true, ...String_Required_NotEmpty("app") },
        path: String_Required_NotEmpty("path"),
        volume: { type: Number, default: 1 },
    },
    {
        timestamps: false,
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
        createdAt: { type: Number, rangeKey: true, default: () => Date.now() },
        amountCents: { type: Number, required: true },
        previousBalance: { type: String }, // Available when the payment is settled
        newBalance: { type: String }, // Available when the payment is settled
        currency: { ...String_Required_NotEmpty("currency") },
        status: { ...String_Required_NotEmpty("status") },
        stripePaymentIntent: {
            ...String_Required_NotEmpty("stripePaymentIntent"),
        },
        stripeSessionObject: { type: Object, required: true },
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
        createdAt: { type: Number, rangeKey: true, default: () => Date.now() },
        receiveCents: { type: Number, required: true },
        withdrawCents: { type: Number, required: true },
        previousBalance: { type: String }, // Available when the payment is settled
        newBalance: { type: String }, // Available when the payment is settled
        currency: { ...String_Required_NotEmpty("currency") },
        stripeTransferId: {
            ...String_Required_NotEmpty("stripePaymentIntent"),
        },
        stripeTransferObject: { type: Object, required: true },
    },
    {
        timestamps: {
            updatedAt: "updatedAt",
        },
    }
);

// const PayoutTableSchema = new dynamoose.Schema({});

// const UsageMetricTableSchema = new dynamoose.Schema(
//     {
//         subscriber: { hashKey: true, ...String_REQUIRED_NON_EMPTY },
//         app: { index: true, ...String_REQUIRED_NON_EMPTY },
//         periodStart: { type: Number, rangeKey: true, required: true },
//         endpoint: String_REQUIRED_NON_EMPTY,
//         volume: { type: Number, default: 0 },
//     },
//     { timestamps: true }
// );

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
export class Subscribe extends Item {
    subscriber: string;
    app: string;
    pricing: string;
    createdAt: number;
}
/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.
export class UsageLog extends Item {
    subscriber: string;
    app: string;
    path: string;
    volume: number;
    createdAt: number;
}
/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.
export class UsageMetric extends Item {
    subscriber: string;
    app: string;
    endpoint: string;
    volume: number;
    createdAt: number;
}
/// When creating a new Item class, remember to add it to codegen.yml mappers
/// config.
export class StripePaymentAccept extends Item {
    user: string;
    amountCents: number;
    currency: string;
    status: string;
    stripeSessionObject: object;
    stripePaymentIntent: string;
    stripeSessionId: string;
    createdAt: number;
    oldBalance: string;
    newBalance: string;
}
export class StripeTransfer extends Item {
    receiver: string;
    withdrawCents: number;
    receiveCents: number;
    currency: string;
    status: string;
    stripeTransferObject: object;
    stripeTransferId: string;
    createdAt: number;
    oldBalance: string;
    newBalance: string;
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
export const SubscribeModel = dynamoose.model<Subscribe>(
    "Subscribe",
    SubscribeTableSchema,
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
