// Code generated by github.com/Khan/genqlient, DO NOT EDIT.

package main

import (
	"context"

	"github.com/Khan/genqlient/graphql"
)

// CheckUserIsAllowedToCallEndpointCheckUserIsAllowedForGatewayRequestGatewayDecisionResponse includes the requested fields of the GraphQL type GatewayDecisionResponse.
type CheckUserIsAllowedToCallEndpointCheckUserIsAllowedForGatewayRequestGatewayDecisionResponse struct {
	Allowed   bool                          `json:"allowed"`
	Reason    GatewayDecisionResponseReason `json:"reason"`
	PricingPK string                        `json:"pricingPK"`
}

// GetAllowed returns CheckUserIsAllowedToCallEndpointCheckUserIsAllowedForGatewayRequestGatewayDecisionResponse.Allowed, and is useful for accessing the field via an interface.
func (v *CheckUserIsAllowedToCallEndpointCheckUserIsAllowedForGatewayRequestGatewayDecisionResponse) GetAllowed() bool {
	return v.Allowed
}

// GetReason returns CheckUserIsAllowedToCallEndpointCheckUserIsAllowedForGatewayRequestGatewayDecisionResponse.Reason, and is useful for accessing the field via an interface.
func (v *CheckUserIsAllowedToCallEndpointCheckUserIsAllowedForGatewayRequestGatewayDecisionResponse) GetReason() GatewayDecisionResponseReason {
	return v.Reason
}

// GetPricingPK returns CheckUserIsAllowedToCallEndpointCheckUserIsAllowedForGatewayRequestGatewayDecisionResponse.PricingPK, and is useful for accessing the field via an interface.
func (v *CheckUserIsAllowedToCallEndpointCheckUserIsAllowedForGatewayRequestGatewayDecisionResponse) GetPricingPK() string {
	return v.PricingPK
}

// CheckUserIsAllowedToCallEndpointResponse is returned by CheckUserIsAllowedToCallEndpoint on success.
type CheckUserIsAllowedToCallEndpointResponse struct {
	CheckUserIsAllowedForGatewayRequest CheckUserIsAllowedToCallEndpointCheckUserIsAllowedForGatewayRequestGatewayDecisionResponse `json:"checkUserIsAllowedForGatewayRequest"`
}

// GetCheckUserIsAllowedForGatewayRequest returns CheckUserIsAllowedToCallEndpointResponse.CheckUserIsAllowedForGatewayRequest, and is useful for accessing the field via an interface.
func (v *CheckUserIsAllowedToCallEndpointResponse) GetCheckUserIsAllowedForGatewayRequest() CheckUserIsAllowedToCallEndpointCheckUserIsAllowedForGatewayRequestGatewayDecisionResponse {
	return v.CheckUserIsAllowedForGatewayRequest
}

// CreateUsageLogCreateUsageLog includes the requested fields of the GraphQL type UsageLog.
type CreateUsageLogCreateUsageLog struct {
	CreatedAt int64 `json:"createdAt"`
}

// GetCreatedAt returns CreateUsageLogCreateUsageLog.CreatedAt, and is useful for accessing the field via an interface.
func (v *CreateUsageLogCreateUsageLog) GetCreatedAt() int64 { return v.CreatedAt }

// CreateUsageLogResponse is returned by CreateUsageLog on success.
type CreateUsageLogResponse struct {
	CreateUsageLog CreateUsageLogCreateUsageLog `json:"createUsageLog"`
}

// GetCreateUsageLog returns CreateUsageLogResponse.CreateUsageLog, and is useful for accessing the field via an interface.
func (v *CreateUsageLogResponse) GetCreateUsageLog() CreateUsageLogCreateUsageLog {
	return v.CreateUsageLog
}

type GatewayDecisionResponseReason string

const (
	GatewayDecisionResponseReasonInsufficientBalance      GatewayDecisionResponseReason = "insufficient_balance"
	GatewayDecisionResponseReasonOwnerInsufficientBalance GatewayDecisionResponseReason = "owner_insufficient_balance"
	GatewayDecisionResponseReasonNotSubscribed            GatewayDecisionResponseReason = "not_subscribed"
	GatewayDecisionResponseReasonTooManyRequests          GatewayDecisionResponseReason = "too_many_requests"
)

// GetAppRoutesApp includes the requested fields of the GraphQL type App.
type GetAppRoutesApp struct {
	Name        string                             `json:"name"`
	GatewayMode string                             `json:"gatewayMode"`
	Endpoints   []GetAppRoutesAppEndpointsEndpoint `json:"endpoints"`
}

// GetName returns GetAppRoutesApp.Name, and is useful for accessing the field via an interface.
func (v *GetAppRoutesApp) GetName() string { return v.Name }

// GetGatewayMode returns GetAppRoutesApp.GatewayMode, and is useful for accessing the field via an interface.
func (v *GetAppRoutesApp) GetGatewayMode() string { return v.GatewayMode }

// GetEndpoints returns GetAppRoutesApp.Endpoints, and is useful for accessing the field via an interface.
func (v *GetAppRoutesApp) GetEndpoints() []GetAppRoutesAppEndpointsEndpoint { return v.Endpoints }

// GetAppRoutesAppEndpointsEndpoint includes the requested fields of the GraphQL type Endpoint.
type GetAppRoutesAppEndpointsEndpoint struct {
	Path        string `json:"path"`
	Destination string `json:"destination"`
}

// GetPath returns GetAppRoutesAppEndpointsEndpoint.Path, and is useful for accessing the field via an interface.
func (v *GetAppRoutesAppEndpointsEndpoint) GetPath() string { return v.Path }

// GetDestination returns GetAppRoutesAppEndpointsEndpoint.Destination, and is useful for accessing the field via an interface.
func (v *GetAppRoutesAppEndpointsEndpoint) GetDestination() string { return v.Destination }

// GetAppRoutesResponse is returned by GetAppRoutes on success.
type GetAppRoutesResponse struct {
	App GetAppRoutesApp `json:"app"`
}

// GetApp returns GetAppRoutesResponse.App, and is useful for accessing the field via an interface.
func (v *GetAppRoutesResponse) GetApp() GetAppRoutesApp { return v.App }

// GetPreviousCallTimestampResponse is returned by GetPreviousCallTimestamp on success.
type GetPreviousCallTimestampResponse struct {
	User GetPreviousCallTimestampUser `json:"user"`
}

// GetUser returns GetPreviousCallTimestampResponse.User, and is useful for accessing the field via an interface.
func (v *GetPreviousCallTimestampResponse) GetUser() GetPreviousCallTimestampUser { return v.User }

// GetPreviousCallTimestampUser includes the requested fields of the GraphQL type User.
type GetPreviousCallTimestampUser struct {
	UsageLogs []GetPreviousCallTimestampUserUsageLogsUsageLog `json:"usageLogs"`
}

// GetUsageLogs returns GetPreviousCallTimestampUser.UsageLogs, and is useful for accessing the field via an interface.
func (v *GetPreviousCallTimestampUser) GetUsageLogs() []GetPreviousCallTimestampUserUsageLogsUsageLog {
	return v.UsageLogs
}

// GetPreviousCallTimestampUserUsageLogsUsageLog includes the requested fields of the GraphQL type UsageLog.
type GetPreviousCallTimestampUserUsageLogsUsageLog struct {
	CreatedAt int64 `json:"createdAt"`
}

// GetCreatedAt returns GetPreviousCallTimestampUserUsageLogsUsageLog.CreatedAt, and is useful for accessing the field via an interface.
func (v *GetPreviousCallTimestampUserUsageLogsUsageLog) GetCreatedAt() int64 { return v.CreatedAt }

// GetUserBalanceResponse is returned by GetUserBalance on success.
type GetUserBalanceResponse struct {
	User GetUserBalanceUser `json:"user"`
}

// GetUser returns GetUserBalanceResponse.User, and is useful for accessing the field via an interface.
func (v *GetUserBalanceResponse) GetUser() GetUserBalanceUser { return v.User }

// GetUserBalanceUser includes the requested fields of the GraphQL type User.
type GetUserBalanceUser struct {
	Balance string `json:"balance"`
}

// GetBalance returns GetUserBalanceUser.Balance, and is useful for accessing the field via an interface.
func (v *GetUserBalanceUser) GetBalance() string { return v.Balance }

// GetUserSubscriptionPlanResponse is returned by GetUserSubscriptionPlan on success.
type GetUserSubscriptionPlanResponse struct {
	Subscription GetUserSubscriptionPlanSubscriptionSubscribe `json:"subscription"`
}

// GetSubscription returns GetUserSubscriptionPlanResponse.Subscription, and is useful for accessing the field via an interface.
func (v *GetUserSubscriptionPlanResponse) GetSubscription() GetUserSubscriptionPlanSubscriptionSubscribe {
	return v.Subscription
}

// GetUserSubscriptionPlanSubscriptionSubscribe includes the requested fields of the GraphQL type Subscribe.
type GetUserSubscriptionPlanSubscriptionSubscribe struct {
	Pricing GetUserSubscriptionPlanSubscriptionSubscribePricing `json:"pricing"`
}

// GetPricing returns GetUserSubscriptionPlanSubscriptionSubscribe.Pricing, and is useful for accessing the field via an interface.
func (v *GetUserSubscriptionPlanSubscriptionSubscribe) GetPricing() GetUserSubscriptionPlanSubscriptionSubscribePricing {
	return v.Pricing
}

// GetUserSubscriptionPlanSubscriptionSubscribePricing includes the requested fields of the GraphQL type Pricing.
type GetUserSubscriptionPlanSubscriptionSubscribePricing struct {
	Name             string `json:"name"`
	MinMonthlyCharge string `json:"minMonthlyCharge"`
	ChargePerRequest string `json:"chargePerRequest"`
}

// GetName returns GetUserSubscriptionPlanSubscriptionSubscribePricing.Name, and is useful for accessing the field via an interface.
func (v *GetUserSubscriptionPlanSubscriptionSubscribePricing) GetName() string { return v.Name }

// GetMinMonthlyCharge returns GetUserSubscriptionPlanSubscriptionSubscribePricing.MinMonthlyCharge, and is useful for accessing the field via an interface.
func (v *GetUserSubscriptionPlanSubscriptionSubscribePricing) GetMinMonthlyCharge() string {
	return v.MinMonthlyCharge
}

// GetChargePerRequest returns GetUserSubscriptionPlanSubscriptionSubscribePricing.ChargePerRequest, and is useful for accessing the field via an interface.
func (v *GetUserSubscriptionPlanSubscriptionSubscribePricing) GetChargePerRequest() string {
	return v.ChargePerRequest
}

// TriggerBillingResponse is returned by TriggerBilling on success.
type TriggerBillingResponse struct {
	TriggerBilling []TriggerBillingTriggerBillingUsageSummary `json:"triggerBilling"`
}

// GetTriggerBilling returns TriggerBillingResponse.TriggerBilling, and is useful for accessing the field via an interface.
func (v *TriggerBillingResponse) GetTriggerBilling() []TriggerBillingTriggerBillingUsageSummary {
	return v.TriggerBilling
}

// TriggerBillingTriggerBillingUsageSummary includes the requested fields of the GraphQL type UsageSummary.
type TriggerBillingTriggerBillingUsageSummary struct {
	CreatedAt int64 `json:"createdAt"`
}

// GetCreatedAt returns TriggerBillingTriggerBillingUsageSummary.CreatedAt, and is useful for accessing the field via an interface.
func (v *TriggerBillingTriggerBillingUsageSummary) GetCreatedAt() int64 { return v.CreatedAt }

// __CheckUserIsAllowedToCallEndpointInput is used internally by genqlient
type __CheckUserIsAllowedToCallEndpointInput struct {
	User string `json:"user"`
	App  string `json:"app"`
}

// GetUser returns __CheckUserIsAllowedToCallEndpointInput.User, and is useful for accessing the field via an interface.
func (v *__CheckUserIsAllowedToCallEndpointInput) GetUser() string { return v.User }

// GetApp returns __CheckUserIsAllowedToCallEndpointInput.App, and is useful for accessing the field via an interface.
func (v *__CheckUserIsAllowedToCallEndpointInput) GetApp() string { return v.App }

// __CreateUsageLogInput is used internally by genqlient
type __CreateUsageLogInput struct {
	UserEmail string `json:"userEmail"`
	App_name  string `json:"app_name"`
	Path      string `json:"path"`
	Pricing   string `json:"pricing"`
}

// GetUserEmail returns __CreateUsageLogInput.UserEmail, and is useful for accessing the field via an interface.
func (v *__CreateUsageLogInput) GetUserEmail() string { return v.UserEmail }

// GetApp_name returns __CreateUsageLogInput.App_name, and is useful for accessing the field via an interface.
func (v *__CreateUsageLogInput) GetApp_name() string { return v.App_name }

// GetPath returns __CreateUsageLogInput.Path, and is useful for accessing the field via an interface.
func (v *__CreateUsageLogInput) GetPath() string { return v.Path }

// GetPricing returns __CreateUsageLogInput.Pricing, and is useful for accessing the field via an interface.
func (v *__CreateUsageLogInput) GetPricing() string { return v.Pricing }

// __GetAppRoutesInput is used internally by genqlient
type __GetAppRoutesInput struct {
	App string `json:"app"`
}

// GetApp returns __GetAppRoutesInput.App, and is useful for accessing the field via an interface.
func (v *__GetAppRoutesInput) GetApp() string { return v.App }

// __GetPreviousCallTimestampInput is used internally by genqlient
type __GetPreviousCallTimestampInput struct {
	UserEmail string `json:"userEmail"`
	App       string `json:"app"`
}

// GetUserEmail returns __GetPreviousCallTimestampInput.UserEmail, and is useful for accessing the field via an interface.
func (v *__GetPreviousCallTimestampInput) GetUserEmail() string { return v.UserEmail }

// GetApp returns __GetPreviousCallTimestampInput.App, and is useful for accessing the field via an interface.
func (v *__GetPreviousCallTimestampInput) GetApp() string { return v.App }

// __GetUserBalanceInput is used internally by genqlient
type __GetUserBalanceInput struct {
	UserEmail string `json:"userEmail"`
}

// GetUserEmail returns __GetUserBalanceInput.UserEmail, and is useful for accessing the field via an interface.
func (v *__GetUserBalanceInput) GetUserEmail() string { return v.UserEmail }

// __GetUserSubscriptionPlanInput is used internally by genqlient
type __GetUserSubscriptionPlanInput struct {
	UserEmail string `json:"userEmail"`
	App       string `json:"app"`
}

// GetUserEmail returns __GetUserSubscriptionPlanInput.UserEmail, and is useful for accessing the field via an interface.
func (v *__GetUserSubscriptionPlanInput) GetUserEmail() string { return v.UserEmail }

// GetApp returns __GetUserSubscriptionPlanInput.App, and is useful for accessing the field via an interface.
func (v *__GetUserSubscriptionPlanInput) GetApp() string { return v.App }

// __TriggerBillingInput is used internally by genqlient
type __TriggerBillingInput struct {
	User string `json:"user"`
	App  string `json:"app"`
}

// GetUser returns __TriggerBillingInput.User, and is useful for accessing the field via an interface.
func (v *__TriggerBillingInput) GetUser() string { return v.User }

// GetApp returns __TriggerBillingInput.App, and is useful for accessing the field via an interface.
func (v *__TriggerBillingInput) GetApp() string { return v.App }

func CheckUserIsAllowedToCallEndpoint(
	ctx context.Context,
	client graphql.Client,
	user string,
	app string,
) (*CheckUserIsAllowedToCallEndpointResponse, error) {
	req := &graphql.Request{
		OpName: "CheckUserIsAllowedToCallEndpoint",
		Query: `
query CheckUserIsAllowedToCallEndpoint ($user: ID!, $app: ID!) {
	checkUserIsAllowedForGatewayRequest(user: $user, app: $app) {
		allowed
		reason
		pricingPK
	}
}
`,
		Variables: &__CheckUserIsAllowedToCallEndpointInput{
			User: user,
			App:  app,
		},
	}
	var err error

	var data CheckUserIsAllowedToCallEndpointResponse
	resp := &graphql.Response{Data: &data}

	err = client.MakeRequest(
		ctx,
		req,
		resp,
	)

	return &data, err
}

func CreateUsageLog(
	ctx context.Context,
	client graphql.Client,
	userEmail string,
	app_name string,
	path string,
	pricing string,
) (*CreateUsageLogResponse, error) {
	req := &graphql.Request{
		OpName: "CreateUsageLog",
		Query: `
mutation CreateUsageLog ($userEmail: Email!, $app_name: String!, $path: String!, $pricing: ID!) {
	createUsageLog(subscriber: $userEmail, app: $app_name, path: $path, pricing: $pricing) {
		createdAt
	}
}
`,
		Variables: &__CreateUsageLogInput{
			UserEmail: userEmail,
			App_name:  app_name,
			Path:      path,
			Pricing:   pricing,
		},
	}
	var err error

	var data CreateUsageLogResponse
	resp := &graphql.Response{Data: &data}

	err = client.MakeRequest(
		ctx,
		req,
		resp,
	)

	return &data, err
}

func GetAppRoutes(
	ctx context.Context,
	client graphql.Client,
	app string,
) (*GetAppRoutesResponse, error) {
	req := &graphql.Request{
		OpName: "GetAppRoutes",
		Query: `
query GetAppRoutes ($app: String) {
	app(name: $app) {
		name
		gatewayMode
		endpoints {
			path
			destination
		}
	}
}
`,
		Variables: &__GetAppRoutesInput{
			App: app,
		},
	}
	var err error

	var data GetAppRoutesResponse
	resp := &graphql.Response{Data: &data}

	err = client.MakeRequest(
		ctx,
		req,
		resp,
	)

	return &data, err
}

func GetPreviousCallTimestamp(
	ctx context.Context,
	client graphql.Client,
	userEmail string,
	app string,
) (*GetPreviousCallTimestampResponse, error) {
	req := &graphql.Request{
		OpName: "GetPreviousCallTimestamp",
		Query: `
query GetPreviousCallTimestamp ($userEmail: Email!, $app: String!) {
	user(email: $userEmail) {
		usageLogs(app: $app, limit: 1) {
			createdAt
		}
	}
}
`,
		Variables: &__GetPreviousCallTimestampInput{
			UserEmail: userEmail,
			App:       app,
		},
	}
	var err error

	var data GetPreviousCallTimestampResponse
	resp := &graphql.Response{Data: &data}

	err = client.MakeRequest(
		ctx,
		req,
		resp,
	)

	return &data, err
}

func GetUserBalance(
	ctx context.Context,
	client graphql.Client,
	userEmail string,
) (*GetUserBalanceResponse, error) {
	req := &graphql.Request{
		OpName: "GetUserBalance",
		Query: `
query GetUserBalance ($userEmail: Email!) {
	user(email: $userEmail) {
		balance
	}
}
`,
		Variables: &__GetUserBalanceInput{
			UserEmail: userEmail,
		},
	}
	var err error

	var data GetUserBalanceResponse
	resp := &graphql.Response{Data: &data}

	err = client.MakeRequest(
		ctx,
		req,
		resp,
	)

	return &data, err
}

func GetUserSubscriptionPlan(
	ctx context.Context,
	client graphql.Client,
	userEmail string,
	app string,
) (*GetUserSubscriptionPlanResponse, error) {
	req := &graphql.Request{
		OpName: "GetUserSubscriptionPlan",
		Query: `
query GetUserSubscriptionPlan ($userEmail: Email!, $app: String!) {
	subscription(subscriber: $userEmail, app: $app) {
		pricing {
			name
			minMonthlyCharge
			chargePerRequest
		}
	}
}
`,
		Variables: &__GetUserSubscriptionPlanInput{
			UserEmail: userEmail,
			App:       app,
		},
	}
	var err error

	var data GetUserSubscriptionPlanResponse
	resp := &graphql.Response{Data: &data}

	err = client.MakeRequest(
		ctx,
		req,
		resp,
	)

	return &data, err
}

func TriggerBilling(
	ctx context.Context,
	client graphql.Client,
	user string,
	app string,
) (*TriggerBillingResponse, error) {
	req := &graphql.Request{
		OpName: "TriggerBilling",
		Query: `
mutation TriggerBilling ($user: ID!, $app: ID!) {
	triggerBilling(user: $user, app: $app) {
		createdAt
	}
}
`,
		Variables: &__TriggerBillingInput{
			User: user,
			App:  app,
		},
	}
	var err error

	var data TriggerBillingResponse
	resp := &graphql.Response{Data: &data}

	err = client.MakeRequest(
		ctx,
		req,
		resp,
	)

	return &data, err
}
