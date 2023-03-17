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
	UserPK    string                        `json:"userPK"`
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

// GetUserPK returns CheckUserIsAllowedToCallEndpointCheckUserIsAllowedForGatewayRequestGatewayDecisionResponse.UserPK, and is useful for accessing the field via an interface.
func (v *CheckUserIsAllowedToCallEndpointCheckUserIsAllowedForGatewayRequestGatewayDecisionResponse) GetUserPK() string {
	return v.UserPK
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
	UserEmail string `json:"userEmail"`
	App       string `json:"app"`
}

// GetUserEmail returns __CheckUserIsAllowedToCallEndpointInput.UserEmail, and is useful for accessing the field via an interface.
func (v *__CheckUserIsAllowedToCallEndpointInput) GetUserEmail() string { return v.UserEmail }

// GetApp returns __CheckUserIsAllowedToCallEndpointInput.App, and is useful for accessing the field via an interface.
func (v *__CheckUserIsAllowedToCallEndpointInput) GetApp() string { return v.App }

// __CreateUsageLogInput is used internally by genqlient
type __CreateUsageLogInput struct {
	User    string `json:"user"`
	App     string `json:"app"`
	Path    string `json:"path"`
	Pricing string `json:"pricing"`
}

// GetUser returns __CreateUsageLogInput.User, and is useful for accessing the field via an interface.
func (v *__CreateUsageLogInput) GetUser() string { return v.User }

// GetApp returns __CreateUsageLogInput.App, and is useful for accessing the field via an interface.
func (v *__CreateUsageLogInput) GetApp() string { return v.App }

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
	userEmail string,
	app string,
) (*CheckUserIsAllowedToCallEndpointResponse, error) {
	req := &graphql.Request{
		OpName: "CheckUserIsAllowedToCallEndpoint",
		Query: `
query CheckUserIsAllowedToCallEndpoint ($userEmail: Email!, $app: ID!) {
	checkUserIsAllowedForGatewayRequest(userEmail: $userEmail, app: $app) {
		allowed
		reason
		pricingPK
		userPK
	}
}
`,
		Variables: &__CheckUserIsAllowedToCallEndpointInput{
			UserEmail: userEmail,
			App:       app,
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
	user string,
	app string,
	path string,
	pricing string,
) (*CreateUsageLogResponse, error) {
	req := &graphql.Request{
		OpName: "CreateUsageLog",
		Query: `
mutation CreateUsageLog ($user: ID!, $app: ID!, $path: String!, $pricing: ID!) {
	createUsageLog(subscriber: $user, app: $app, path: $path, pricing: $pricing) {
		createdAt
	}
}
`,
		Variables: &__CreateUsageLogInput{
			User:    user,
			App:     app,
			Path:    path,
			Pricing: pricing,
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
