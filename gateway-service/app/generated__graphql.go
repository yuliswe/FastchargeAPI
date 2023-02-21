// Code generated by github.com/Khan/genqlient, DO NOT EDIT.

package main

import (
	"context"

	"github.com/Khan/genqlient/graphql"
)

// BillUsageCreateUsageLog includes the requested fields of the GraphQL type UsageLog.
type BillUsageCreateUsageLog struct {
	CreatedAt int64 `json:"createdAt"`
}

// GetCreatedAt returns BillUsageCreateUsageLog.CreatedAt, and is useful for accessing the field via an interface.
func (v *BillUsageCreateUsageLog) GetCreatedAt() int64 { return v.CreatedAt }

// BillUsageResponse is returned by BillUsage on success.
type BillUsageResponse struct {
	CreateUsageLog BillUsageCreateUsageLog `json:"createUsageLog"`
}

// GetCreateUsageLog returns BillUsageResponse.CreateUsageLog, and is useful for accessing the field via an interface.
func (v *BillUsageResponse) GetCreateUsageLog() BillUsageCreateUsageLog { return v.CreateUsageLog }

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
	TriggerBilling TriggerBillingTriggerBillingUsageSummary `json:"triggerBilling"`
}

// GetTriggerBilling returns TriggerBillingResponse.TriggerBilling, and is useful for accessing the field via an interface.
func (v *TriggerBillingResponse) GetTriggerBilling() TriggerBillingTriggerBillingUsageSummary {
	return v.TriggerBilling
}

// TriggerBillingTriggerBillingUsageSummary includes the requested fields of the GraphQL type UsageSummary.
type TriggerBillingTriggerBillingUsageSummary struct {
	CreatedAt int64 `json:"createdAt"`
}

// GetCreatedAt returns TriggerBillingTriggerBillingUsageSummary.CreatedAt, and is useful for accessing the field via an interface.
func (v *TriggerBillingTriggerBillingUsageSummary) GetCreatedAt() int64 { return v.CreatedAt }

// __BillUsageInput is used internally by genqlient
type __BillUsageInput struct {
	UserEmail string `json:"userEmail"`
	App_name  string `json:"app_name"`
	Path      string `json:"path"`
}

// GetUserEmail returns __BillUsageInput.UserEmail, and is useful for accessing the field via an interface.
func (v *__BillUsageInput) GetUserEmail() string { return v.UserEmail }

// GetApp_name returns __BillUsageInput.App_name, and is useful for accessing the field via an interface.
func (v *__BillUsageInput) GetApp_name() string { return v.App_name }

// GetPath returns __BillUsageInput.Path, and is useful for accessing the field via an interface.
func (v *__BillUsageInput) GetPath() string { return v.Path }

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
}

// GetUser returns __TriggerBillingInput.User, and is useful for accessing the field via an interface.
func (v *__TriggerBillingInput) GetUser() string { return v.User }

func BillUsage(
	ctx context.Context,
	client graphql.Client,
	userEmail string,
	app_name string,
	path string,
) (*BillUsageResponse, error) {
	req := &graphql.Request{
		OpName: "BillUsage",
		Query: `
mutation BillUsage ($userEmail: Email!, $app_name: String!, $path: String!) {
	createUsageLog(subscriber: $userEmail, app: $app_name, path: $path) {
		createdAt
	}
}
`,
		Variables: &__BillUsageInput{
			UserEmail: userEmail,
			App_name:  app_name,
			Path:      path,
		},
	}
	var err error

	var data BillUsageResponse
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
) (*TriggerBillingResponse, error) {
	req := &graphql.Request{
		OpName: "TriggerBilling",
		Query: `
mutation TriggerBilling ($user: ID!) {
	triggerBilling(user: $user) {
		createdAt
	}
}
`,
		Variables: &__TriggerBillingInput{
			User: user,
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
