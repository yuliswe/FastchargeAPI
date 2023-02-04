import sgqlc.types
import sgqlc.types.datetime


schema = sgqlc.types.Schema()



########################################################################
# Scalars and Enumerations
########################################################################
class AccountNumber(sgqlc.types.Scalar):
    __schema__ = schema


class BigInt(sgqlc.types.Scalar):
    __schema__ = schema


Boolean = sgqlc.types.Boolean

class Byte(sgqlc.types.Scalar):
    __schema__ = schema


class CountryCode(sgqlc.types.Scalar):
    __schema__ = schema


class Cuid(sgqlc.types.Scalar):
    __schema__ = schema


class Currency(sgqlc.types.Scalar):
    __schema__ = schema


class DID(sgqlc.types.Scalar):
    __schema__ = schema


Date = sgqlc.types.datetime.Date

DateTime = sgqlc.types.datetime.DateTime

class Duration(sgqlc.types.Scalar):
    __schema__ = schema


class Email(sgqlc.types.Scalar):
    __schema__ = schema


class EmailAddress(sgqlc.types.Scalar):
    __schema__ = schema


class GUID(sgqlc.types.Scalar):
    __schema__ = schema


class GatewayMode(sgqlc.types.Enum):
    __schema__ = schema
    __choices__ = ('Proxy', 'Redirect')


class HSL(sgqlc.types.Scalar):
    __schema__ = schema


class HSLA(sgqlc.types.Scalar):
    __schema__ = schema


class HexColorCode(sgqlc.types.Scalar):
    __schema__ = schema


class Hexadecimal(sgqlc.types.Scalar):
    __schema__ = schema


class IBAN(sgqlc.types.Scalar):
    __schema__ = schema


ID = sgqlc.types.ID

class IP(sgqlc.types.Scalar):
    __schema__ = schema


class IPv4(sgqlc.types.Scalar):
    __schema__ = schema


class IPv6(sgqlc.types.Scalar):
    __schema__ = schema


class ISBN(sgqlc.types.Scalar):
    __schema__ = schema


class ISO8601Duration(sgqlc.types.Scalar):
    __schema__ = schema


Int = sgqlc.types.Int

class JSON(sgqlc.types.Scalar):
    __schema__ = schema


class JSONObject(sgqlc.types.Scalar):
    __schema__ = schema


class JWT(sgqlc.types.Scalar):
    __schema__ = schema


class Latitude(sgqlc.types.Scalar):
    __schema__ = schema


class LocalDate(sgqlc.types.Scalar):
    __schema__ = schema


class LocalEndTime(sgqlc.types.Scalar):
    __schema__ = schema


class LocalTime(sgqlc.types.Scalar):
    __schema__ = schema


class Locale(sgqlc.types.Scalar):
    __schema__ = schema


class Long(sgqlc.types.Scalar):
    __schema__ = schema


class Longitude(sgqlc.types.Scalar):
    __schema__ = schema


class MAC(sgqlc.types.Scalar):
    __schema__ = schema


class NegativeFloat(sgqlc.types.Scalar):
    __schema__ = schema


class NegativeInt(sgqlc.types.Scalar):
    __schema__ = schema


class NonEmptyString(sgqlc.types.Scalar):
    __schema__ = schema


class NonNegativeDecimal(sgqlc.types.Scalar):
    __schema__ = schema


class NonNegativeFloat(sgqlc.types.Scalar):
    __schema__ = schema


class NonNegativeInt(sgqlc.types.Scalar):
    __schema__ = schema


class NonPositiveFloat(sgqlc.types.Scalar):
    __schema__ = schema


class NonPositiveInt(sgqlc.types.Scalar):
    __schema__ = schema


class ObjectID(sgqlc.types.Scalar):
    __schema__ = schema


class PhoneNumber(sgqlc.types.Scalar):
    __schema__ = schema


class Port(sgqlc.types.Scalar):
    __schema__ = schema


class PositiveFloat(sgqlc.types.Scalar):
    __schema__ = schema


class PositiveInt(sgqlc.types.Scalar):
    __schema__ = schema


class PostalCode(sgqlc.types.Scalar):
    __schema__ = schema


class RGB(sgqlc.types.Scalar):
    __schema__ = schema


class RGBA(sgqlc.types.Scalar):
    __schema__ = schema


class RoutingNumber(sgqlc.types.Scalar):
    __schema__ = schema


class SafeInt(sgqlc.types.Scalar):
    __schema__ = schema


class SemVer(sgqlc.types.Scalar):
    __schema__ = schema


String = sgqlc.types.String

Time = sgqlc.types.datetime.Time

class TimeZone(sgqlc.types.Scalar):
    __schema__ = schema


class Timestamp(sgqlc.types.Scalar):
    __schema__ = schema


class URL(sgqlc.types.Scalar):
    __schema__ = schema


class USCurrency(sgqlc.types.Scalar):
    __schema__ = schema


class UUID(sgqlc.types.Scalar):
    __schema__ = schema


class UnsignedFloat(sgqlc.types.Scalar):
    __schema__ = schema


class UnsignedInt(sgqlc.types.Scalar):
    __schema__ = schema


class UtcOffset(sgqlc.types.Scalar):
    __schema__ = schema


class Void(sgqlc.types.Scalar):
    __schema__ = schema



########################################################################
# Input Objects
########################################################################

########################################################################
# Output Objects and Interfaces
########################################################################
class App(sgqlc.types.Type):
    __schema__ = schema
    __field_names__ = ('name', 'description', 'owner', 'endpoints', 'owned_by_you', 'pricing_plans', 'gateway_mode', 'update_app', 'delete_app')
    name = sgqlc.types.Field(sgqlc.types.non_null(NonEmptyString), graphql_name='name')
    description = sgqlc.types.Field(String, graphql_name='description')
    owner = sgqlc.types.Field('User', graphql_name='owner')
    endpoints = sgqlc.types.Field(sgqlc.types.list_of('Endpoint'), graphql_name='endpoints')
    owned_by_you = sgqlc.types.Field(Boolean, graphql_name='ownedByYou')
    pricing_plans = sgqlc.types.Field(sgqlc.types.list_of('Pricing'), graphql_name='pricingPlans')
    gateway_mode = sgqlc.types.Field(GatewayMode, graphql_name='gatewayMode')
    update_app = sgqlc.types.Field('App', graphql_name='updateApp', args=sgqlc.types.ArgDict((
        ('description', sgqlc.types.Arg(String, graphql_name='description', default=None)),
))
    )
    delete_app = sgqlc.types.Field('App', graphql_name='deleteApp')


class Endpoint(sgqlc.types.Type):
    __schema__ = schema
    __field_names__ = ('path', 'description', 'destination', 'ref', 'update_endpoint', 'delete_endpoint')
    path = sgqlc.types.Field(sgqlc.types.non_null(NonEmptyString), graphql_name='path')
    description = sgqlc.types.Field(String, graphql_name='description')
    destination = sgqlc.types.Field(String, graphql_name='destination')
    ref = sgqlc.types.Field(sgqlc.types.non_null(String), graphql_name='ref')
    update_endpoint = sgqlc.types.Field('Endpoint', graphql_name='updateEndpoint', args=sgqlc.types.ArgDict((
        ('path', sgqlc.types.Arg(String, graphql_name='path', default=None)),
        ('destination', sgqlc.types.Arg(String, graphql_name='destination', default=None)),
        ('description', sgqlc.types.Arg(String, graphql_name='description', default=None)),
))
    )
    delete_endpoint = sgqlc.types.Field('Endpoint', graphql_name='deleteEndpoint')


class Mutation(sgqlc.types.Type):
    __schema__ = schema
    __field_names__ = ('reset_tables', 'create_user', 'create_app', 'create_endpoint', 'create_pricing', 'create_subscription')
    reset_tables = sgqlc.types.Field(Boolean, graphql_name='resetTables')
    create_user = sgqlc.types.Field('User', graphql_name='createUser', args=sgqlc.types.ArgDict((
        ('email', sgqlc.types.Arg(sgqlc.types.non_null(Email), graphql_name='email', default=None)),
))
    )
    create_app = sgqlc.types.Field(App, graphql_name='createApp', args=sgqlc.types.ArgDict((
        ('name', sgqlc.types.Arg(sgqlc.types.non_null(NonEmptyString), graphql_name='name', default=None)),
        ('owner', sgqlc.types.Arg(sgqlc.types.non_null(NonEmptyString), graphql_name='owner', default=None)),
        ('gateway_mode', sgqlc.types.Arg(GatewayMode, graphql_name='gatewayMode', default='Proxy')),
        ('description', sgqlc.types.Arg(String, graphql_name='description', default=None)),
))
    )
    create_endpoint = sgqlc.types.Field(Endpoint, graphql_name='createEndpoint', args=sgqlc.types.ArgDict((
        ('app', sgqlc.types.Arg(sgqlc.types.non_null(String), graphql_name='app', default=None)),
        ('path', sgqlc.types.Arg(sgqlc.types.non_null(String), graphql_name='path', default=None)),
        ('destination', sgqlc.types.Arg(sgqlc.types.non_null(String), graphql_name='destination', default=None)),
        ('description', sgqlc.types.Arg(String, graphql_name='description', default=None)),
))
    )
    create_pricing = sgqlc.types.Field('Pricing', graphql_name='createPricing', args=sgqlc.types.ArgDict((
        ('app', sgqlc.types.Arg(sgqlc.types.non_null(String), graphql_name='app', default=None)),
        ('name', sgqlc.types.Arg(sgqlc.types.non_null(String), graphql_name='name', default=None)),
        ('call_to_action', sgqlc.types.Arg(sgqlc.types.non_null(String), graphql_name='callToAction', default=None)),
        ('min_monthly_charge', sgqlc.types.Arg(sgqlc.types.non_null(String), graphql_name='minMonthlyCharge', default=None)),
        ('charge_per_request', sgqlc.types.Arg(sgqlc.types.non_null(String), graphql_name='chargePerRequest', default=None)),
))
    )
    create_subscription = sgqlc.types.Field('Subscribe', graphql_name='createSubscription', args=sgqlc.types.ArgDict((
        ('app', sgqlc.types.Arg(sgqlc.types.non_null(String), graphql_name='app', default=None)),
        ('pricing', sgqlc.types.Arg(sgqlc.types.non_null(String), graphql_name='pricing', default=None)),
        ('subscriber', sgqlc.types.Arg(sgqlc.types.non_null(String), graphql_name='subscriber', default=None)),
))
    )


class Pricing(sgqlc.types.Type):
    __schema__ = schema
    __field_names__ = ('app', 'name', 'call_to_action', 'min_monthly_charge', 'charge_per_request', 'free_quota', 'delete_pricing')
    app = sgqlc.types.Field(sgqlc.types.non_null(App), graphql_name='app')
    name = sgqlc.types.Field(sgqlc.types.non_null(String), graphql_name='name')
    call_to_action = sgqlc.types.Field(sgqlc.types.non_null(String), graphql_name='callToAction')
    min_monthly_charge = sgqlc.types.Field(sgqlc.types.non_null(String), graphql_name='minMonthlyCharge')
    charge_per_request = sgqlc.types.Field(sgqlc.types.non_null(String), graphql_name='chargePerRequest')
    free_quota = sgqlc.types.Field(sgqlc.types.non_null(Int), graphql_name='freeQuota')
    delete_pricing = sgqlc.types.Field('Pricing', graphql_name='deletePricing')


class Query(sgqlc.types.Type):
    __schema__ = schema
    __field_names__ = ('apps', 'app', 'users', 'user', 'endpoint', 'endpoints', 'subscription')
    apps = sgqlc.types.Field(sgqlc.types.list_of(App), graphql_name='apps')
    app = sgqlc.types.Field(App, graphql_name='app', args=sgqlc.types.ArgDict((
        ('name', sgqlc.types.Arg(NonEmptyString, graphql_name='name', default=None)),
))
    )
    users = sgqlc.types.Field(sgqlc.types.list_of('User'), graphql_name='users')
    user = sgqlc.types.Field('User', graphql_name='user', args=sgqlc.types.ArgDict((
        ('email', sgqlc.types.Arg(Email, graphql_name='email', default=None)),
))
    )
    endpoint = sgqlc.types.Field(Endpoint, graphql_name='endpoint', args=sgqlc.types.ArgDict((
        ('ref', sgqlc.types.Arg(ID, graphql_name='ref', default=None)),
        ('app', sgqlc.types.Arg(String, graphql_name='app', default=None)),
        ('path', sgqlc.types.Arg(String, graphql_name='path', default=None)),
))
    )
    endpoints = sgqlc.types.Field(sgqlc.types.list_of(Endpoint), graphql_name='endpoints')
    subscription = sgqlc.types.Field('Subscribe', graphql_name='subscription', args=sgqlc.types.ArgDict((
        ('subscriber', sgqlc.types.Arg(String, graphql_name='subscriber', default=None)),
        ('app', sgqlc.types.Arg(String, graphql_name='app', default=None)),
))
    )


class Subscribe(sgqlc.types.Type):
    __schema__ = schema
    __field_names__ = ('pricing', 'subscriber', 'app', 'created_at', 'delete_subscription')
    pricing = sgqlc.types.Field(sgqlc.types.non_null(Pricing), graphql_name='pricing')
    subscriber = sgqlc.types.Field(sgqlc.types.non_null('User'), graphql_name='subscriber')
    app = sgqlc.types.Field(sgqlc.types.non_null(App), graphql_name='app')
    created_at = sgqlc.types.Field(sgqlc.types.non_null(Int), graphql_name='createdAt')
    delete_subscription = sgqlc.types.Field('Subscribe', graphql_name='deleteSubscription')


class User(sgqlc.types.Type):
    __schema__ = schema
    __field_names__ = ('email', 'name', 'apps', 'subscriptions')
    email = sgqlc.types.Field(sgqlc.types.non_null(Email), graphql_name='email')
    name = sgqlc.types.Field(sgqlc.types.non_null(String), graphql_name='name')
    apps = sgqlc.types.Field(sgqlc.types.list_of(App), graphql_name='apps')
    subscriptions = sgqlc.types.Field(sgqlc.types.list_of(Subscribe), graphql_name='subscriptions')



########################################################################
# Unions
########################################################################

########################################################################
# Schema Entry Points
########################################################################
schema.query_type = Query
schema.mutation_type = Mutation
schema.subscription_type = None

