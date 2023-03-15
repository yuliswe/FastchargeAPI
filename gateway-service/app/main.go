package main

import (
	"compress/gzip"
	"context"
	"crypto/ecdsa"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/TwiN/go-color"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	lru "github.com/hashicorp/golang-lru/v2"
	"github.com/shopspring/decimal"
)

func main() {
	initGraphQLClient()
	lambda.Start(lambdaHandler)
}

/*
This service is expected to be put behind an authentication proxy such as an
aws authorizer. The role of this function is upon receiving a request:
 1. Look up from the resource server the destination url (makes use of a local
    cache).
 2. Send a request to the resource server to bill the usage (concurrently).
 3. Respond a redirect to the client with the destination url.
*/
func lambdaHandler(request events.APIGatewayProxyRequest) (*events.APIGatewayProxyResponse, error) {
	if response, err := handle(request); err == nil {
		return response, nil
	} else {
		response := apiGatewayErrorResponse(500, "INTERNAL_SERVER_ERROR", err.Error())
		return response, err
	}
}

func handle(request events.APIGatewayProxyRequest) (*events.APIGatewayProxyResponse, error) {
	path := request.Path
	app, errResp := parseAppName(request)
	if errResp != nil {
		return errResp, nil
	}

	//fmt.Println("Identifying user")
	user, errResp := parseUser(request)
	if errResp != nil {
		return errResp, nil
	}

	setGraphqlClientUser(user)

	//fmt.Println("Checking is user is allowed to access app", app, "user:", user)
	startTimer := time.Now()
	decision, errorResponse := getGatewayRequestDecision(user, app, path)
	if errorResponse != nil {
		//fmt.Println(color.Red, "User ", user, " is not allowed to access ", app, path, color.Reset)
		return errorResponse, nil
	}

	stopTimer := time.Now()
	fmt.Println(color.Purple, "getGatewayRequestDecision took", stopTimer.Sub(startTimer), color.Reset)

	//fmt.Println("Creating a usage token for user", user, "on app", app, "for path", path)
	// fastchargeUserToken, err := createUserUsageToken(app, user)
	// if err != nil {
	// 	panic(fmt.Sprintln("Cannot generate _fct: ", err))
	// }
	//fmt.Println("Getting route for app", app, "and path", path)
	destination, mode, found := getRoute(app, path)
	if !found {
		response := apiGatewayErrorResponse(404, "NOT_FOUND", "Path Not Found: "+path)
		return response, nil
	}

	fastchargeUserToken := "" // TODO: implement this
	switch mode {
	case RedirectMode:
		if response, err := makeRedirectResponse(destination, request, fastchargeUserToken); err != nil {
			fmt.Println(color.Red, "Error making a redirect response", err, color.Reset)
			return &response, err
		} else {
			go billUsage(user, app, path, decision.PricingPK)
			return &response, nil
		}
	default:
		startTimer := time.Now()
		if response, err := makeForwardResponse(destination, request, fastchargeUserToken); err != nil {
			fmt.Println(color.Red, "Error making a forward response", err, color.Reset)
			return response, err
		} else {
			stopTimer := time.Now()
			fmt.Println(color.Purple, "makeForwardResponse took", stopTimer.Sub(startTimer), color.Reset)
			go billUsage(user, app, path, decision.PricingPK)
			return response, nil
		}
	}
}

func parseAppName(request events.APIGatewayProxyRequest) (string, *events.APIGatewayProxyResponse) {
	host := request.Headers["host"]
	if host == "" {
		host = request.Headers["Host"]
	}
	if host == "" {
		host = request.RequestContext.DomainName
	}
	if host == "" {
		response := apiGatewayErrorResponse(404, "NOT_FOUND", "Host header is missing")
		return "", response
	}
	app := strings.Split(host, ".")[0]
	if app == "" {
		response := apiGatewayErrorResponse(404, "NOT_FOUND", "App name is missing. Host: "+host)
		return "", response
	}
	if app == "api" { // this is reserved for our internal api
		response := apiGatewayErrorResponse(404, "NOT_FOUND", "App Not Found: "+app)
		return "", response
	}
	return app, nil
}

func parseUser(request events.APIGatewayProxyRequest) (string, *events.APIGatewayProxyResponse) {
	var userEmail string
	if os.Getenv("TRUST_X_USER_EMAIL_HEADER") == "1" {
		fmt.Println(color.Red, "TRUST_X_USER_EMAIL_HEADER enabled. Reading user from the X-User-Email header.", color.Reset)
		userEmail = request.Headers["X-User-Email"]
	}
	if user, found := request.RequestContext.Authorizer["userEmail"]; found {
		userEmail = user.(string)
	}
	if userEmail == "" {
		if os.Getenv("TRUST_X_USER_EMAIL_HEADER") == "1" {
			response := apiGatewayErrorResponse(401, "UNAUTHORIZED", "TRUST_X_USER_EMAIL_HEADER enabled. You must provide the X-User-Email header.")
			return "", response
		} else {
			response := apiGatewayErrorResponse(401, "UNAUTHORIZED", "You must be logged in to access this resource.")
			return "", response
		}
	} else {
		return userEmail, nil
	}
}

/*
Handles the request when the app route uses the redirect mode.
*/
func makeRedirectResponse(destination string, request events.APIGatewayProxyRequest, fastchargeUserToken string) (events.APIGatewayProxyResponse, error) {
	//fmt.Println(color.Yellow+"Redirecting to", destination+color.Reset)
	var destinationUrl *url.URL
	if url, err := url.Parse(destination); err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 404,
			Body:       "Not Found: " + destination,
		}, nil
	} else {
		destinationUrl = url
	}
	destinationUrl.Query().Add("_fct", fastchargeUserToken)
	headers := map[string]string{
		"Location": destinationUrl.String(),
	}
	return events.APIGatewayProxyResponse{
		StatusCode: 307,
		Body:       "",
		Headers:    headers,
	}, nil
}

/*
Handles the request when the app route uses the proxy mode.
*/
func makeForwardResponse(destination string, request events.APIGatewayProxyRequest, fastchargeUserToken string) (*events.APIGatewayProxyResponse, error) {
	//fmt.Println(color.Yellow, "Forwarding to", destination, color.Reset)
	var destinationUrl *url.URL
	if url, err := url.Parse(destination); err != nil {
		response := apiGatewayErrorResponse(404, "NOT_FOUND", "Not Found: "+destination)
		return response, nil
	} else {
		destinationUrl = url
	}

	// GET request is not allowed to have a body. Doing so will cause a gateway
	// error on AWS Gateway.
	var requestBody string
	if request.HTTPMethod == "GET" {
		requestBody = ""
	} else {
		requestBody = request.Body
	}

	forwardRequest, err := http.NewRequest(request.HTTPMethod, destinationUrl.String(), strings.NewReader(requestBody))
	if err != nil {
		//fmt.Println(color.Red, "Error creating a forward request", err.Error(), color.Reset)
		return nil, err
	}

	// Forward the parameters of the received request to the destination.
	urlParams := forwardRequest.URL.Query()
	urlParams.Add("_fct", fastchargeUserToken)
	for key, value := range request.QueryStringParameters {
		urlParams.Add(key, value)
	}

	// Forward the headers of the received request to the destination.
	for key, value := range request.Headers {
		forwardRequest.Header.Set(key, value)
	}
	forwardRequest.Header.Set("X-FCT", fastchargeUserToken)
	forwardRequest.Header.Set("Host", destinationUrl.Host)
	forwardRequest.Header.Set("Accept-Encoding", "identity")
	if response, err := http.DefaultClient.Do(forwardRequest); err != nil {
		response := apiGatewayErrorResponse(502, "BAD_GATEWAY", "Bad Gateway: "+err.Error())
		return response, nil
	} else {
		var body []byte
		if err != nil {
			response := apiGatewayErrorResponse(502, "BAD_GATEWAY", "Bad Gateway: "+err.Error())
			return response, nil
		}
		if response.Header.Get("Content-Encoding") == "gzip" {
			plaintext, err := gzip.NewReader(response.Body)
			defer plaintext.Close()
			if err != nil {
				response := apiGatewayErrorResponse(502, "BAD_GATEWAY", "Bad Gateway: "+err.Error())
				return response, nil
			}
			body, err = io.ReadAll(plaintext)
			if err != nil {
				response := apiGatewayErrorResponse(502, "BAD_GATEWAY", "Bad Gateway: "+err.Error())
				return response, nil
			}
		} else {
			body, err = io.ReadAll(response.Body)
			if err != nil {
				response := apiGatewayErrorResponse(502, "BAD_GATEWAY", "Bad Gateway: "+err.Error())
				return response, nil
			}
		}
		headers := map[string]string{}
		for key, _ := range response.Header {
			headers[key] = response.Header.Get(key)
		}
		headers["Content-Encoding"] = "identity"
		delete(headers, "Content-Length")
		response := events.APIGatewayProxyResponse{
			StatusCode: response.StatusCode,
			Headers:    headers,
			Body:       string(body[:]),
		}
		return &response, nil
	}
}

type GatewayMode int

const (
	ProxyMode    GatewayMode = 0
	RedirectMode             = 1
)

type AppRouteInfo struct {
	GatewayMode     GatewayMode
	PathDestination map[string]string
}

func parseGatewayMode(mode string) GatewayMode {
	switch mode {
	case "proxy":
		return ProxyMode
	case "redirect":
		return RedirectMode
	default:
		return ProxyMode
	}
}

var getRouteCache, _ = lru.New[string, AppRouteInfo](1000)

/*
Gets the route from the cache. If the route is not in the cache, it will query
the resource server.
*/
func getRoute(app string, path string) (destination string, gatewayMode GatewayMode, found bool) {
	appRoutes, found := getRouteCache.Get(app)
	if found {
		if destination, found := appRoutes.PathDestination[path]; found {
			return destination, appRoutes.GatewayMode, true
		}
	}
	fmt.Println(color.Yellow, "Getting route for", app, path, color.Reset)
	if routes, err := GetAppRoutes(context.Background(), getGraphQLClient(), app); err != nil {
		fmt.Println(color.Red, "Error getting routes for", app, err, color.Reset)
	} else {
		// fmt.Println(color.Yellow, "Got routes for", app, routes, color.Reset)
		appRoutes = AppRouteInfo{
			GatewayMode:     parseGatewayMode(routes.App.GatewayMode),
			PathDestination: map[string]string{},
		}
		for _, endpoint := range routes.App.Endpoints {
			appRoutes.PathDestination[endpoint.Path] = endpoint.Destination
		}
		getRouteCache.Add(app, appRoutes)
	}
	if destination, found := appRoutes.PathDestination[path]; found {
		return destination, appRoutes.GatewayMode, found
	}
	return "", ProxyMode, false
}

func createUserUsageToken(app string, user string) (string, error) {
	signer := jwt.NewWithClaims(jwt.SigningMethodES256, jwt.MapClaims{
		"app": app,
		"exp": time.Now().Unix() + 180,
		"iat": time.Now().Unix(),
		"iss": "fastcharge",
		"jti": uuid.New().String(),
	})
	token, err := signer.SignedString(getPrivateKey())
	return token, err
}

func billUsage(user string, app string, path string, pricing string) {
	//fmt.Println(color.Yellow, "Billing usage for", user, app, path, color.Reset)

	// Creating usage log can be done synchronously. This ensures that when
	// calling TriggerBilling, the usage log is already created.
	if _, err := CreateUsageLog(
		context.Background(),
		getGraphQLClient(),
		user,
		app,
		path,
		pricing,
	); err != nil {
		fmt.Println(color.Red, "Error creating UsageLog: ", err, color.Reset)
	}
	// Trigger billing must be done on the billing queue.
	if _, err := TriggerBilling(
		context.Background(),
		getSQSGraphQLClient(SQSGraphQLClientConfig{
			MessageDeduplicationId: fmt.Sprintf("trigger-billing-%s-%d", user, time.Now().Unix()),
			MessageGroupId:         "main",
			QueueUrl:               BillingFifoQueueUrl,
		}),
		user,
		app,
	); err != nil {
		fmt.Println(color.Red, "Error triggering billing: ", err, color.Reset)
	}
}

func apiGatewayErrorResponse(code int, reason string, message string) *events.APIGatewayProxyResponse {
	body, _ := json.Marshal(map[string]string{
		"reason":  reason,
		"message": message,
	})
	resp := events.APIGatewayProxyResponse{
		StatusCode: code,
		Body:       string(body),
	}
	return &resp
}

type GatewayDecisionResponse struct {
	Allowed bool
	Pricing string
}

// Checks if the user is allowed to access the endpoint. Caches the result if
// the user is allowed to access. Otherwise, send queries to the graphql backend
// to find out if the user is allowed to access.
func getGatewayRequestDecision(user string, app string, path string) (decision *CheckUserIsAllowedToCallEndpointCheckUserIsAllowedForGatewayRequestGatewayDecisionResponse, errorResponse *events.APIGatewayProxyResponse) {
	result, err := CheckUserIsAllowedToCallEndpoint(context.Background(), getGraphQLClient(), user, app)
	decision = &result.CheckUserIsAllowedForGatewayRequest
	if err != nil {
		fmt.Println(color.Red, "Error checking if user is allowed to call endpoint:", err, color.Reset)
		errorResponse = apiGatewayErrorResponse(500, "INTERNAL_SERVER_ERROR", "Internal Server Error")
		return decision, errorResponse
	}
	if result.CheckUserIsAllowedForGatewayRequest.Allowed {
		return decision, nil
	}
	if result.CheckUserIsAllowedForGatewayRequest.Allowed == false {
		switch result.CheckUserIsAllowedForGatewayRequest.Reason {
		case GatewayDecisionResponseReasonTooManyRequests:
			errorResponse := apiGatewayErrorResponse(429, "TOO_MANY_REQUESTS", "You have made too many requests to this endpoint.")
			return decision, errorResponse
		case GatewayDecisionResponseReasonNotSubscribed:
			errorResponse := apiGatewayErrorResponse(402, "NOT_SUBSCRIBED", "You are not subscribed to this app.")
			return decision, errorResponse
		case GatewayDecisionResponseReasonInsufficientBalance:
			errorResponse := apiGatewayErrorResponse(402, "INSUFFICIENT_BALANCE", "Your account balance is too low to make this request.")
			return decision, errorResponse
		case GatewayDecisionResponseReasonOwnerInsufficientBalance:
			errorResponse := apiGatewayErrorResponse(402, "OWNER_INSUFFICIENT_BALANCE", "The owner of this app does not have enough balance to pay for the free quota used by this request.")
			return decision, errorResponse
		}
	}

	errorResponse = apiGatewayErrorResponse(401, "UNKNOWN_REASON", "You are not allowed to access this endpoint.")
	return decision, errorResponse
}

func getUserBalance(user string) decimal.Decimal {
	if result, err := GetUserBalance(context.Background(), getGraphQLClient(), user); err != nil {
		fmt.Println(color.Red, "Error getting balance for", user, "Error:", err, color.Reset)
		return decimal.NewFromInt(0)
	} else {
		if balance, err := decimal.NewFromString(result.User.Balance); err != nil {
			fmt.Println(color.Red, "Error parsing balance:", err, color.Reset)
			return decimal.NewFromInt(0)
		} else {
			return balance
		}
	}
}

func getEndpointCost(subscription GetUserSubscriptionPlanSubscriptionSubscribe, user string, app string, path string) decimal.Decimal {
	// The endpoint cost is the monthly initial cost (if this is the first call
	// in 30 days) plus the cost per call.
	cost := decimal.NewFromInt(0) // in dollars
	const oneMonthMili int64 = 30 * 24 * 60 * 60 * 1000
	if getPrivousCallTime(user, app) < time.Now().UnixMilli()-oneMonthMili {
		montly, err := decimal.NewFromString(subscription.Pricing.MinMonthlyCharge) // in dollars
		if err != nil {
			fmt.Println(color.Red, "Error parsing min monthly charge:", err.Error(), color.Reset)
			montly = decimal.NewFromInt(0)
		}
		cost = cost.Add(montly)
	}
	perCall, err := decimal.NewFromString(subscription.Pricing.ChargePerRequest) // in dollars
	if err != nil {
		fmt.Println(color.Red, "Error parsing charge per request:", err.Error(), color.Reset)
		perCall = decimal.NewFromInt(0)
	}
	cost = cost.Add(perCall)
	return cost
}

func getPrivousCallTime(user string, app string) int64 {
	if result, err := GetPreviousCallTimestamp(context.Background(), getGraphQLClient(), user, app); err != nil {
		fmt.Println(color.Red, "Error getting previous call timestamp:", err.Error(), color.Reset)
		return 0
	} else if len(result.User.UsageLogs) == 0 {
		return 0
	} else {
		return result.User.UsageLogs[0].CreatedAt
	}
}

func getPrivateKey() *ecdsa.PrivateKey {
	key := []byte(`-----BEGIN EC PRIVATE KEY-----
MHcCAQEEINEyilA1d68VxuH2QmIiP3+Ye6SH1/Z3/2LQc+kVZNj1oAoGCCqGSM49
AwEHoUQDQgAE9CR7SW0cTqQBG1vxWnkjk5dO7zfvUeueXgubjSD6i6vcmHdetZ25
/ItESQDBmX0LL2qYaPzqTJHbWKxqL+6CtA==
-----END EC PRIVATE KEY-----`)
	if parsedKey, err := jwt.ParseECPrivateKeyFromPEM(key); err != nil {
		panic(fmt.Sprintln("Cannot parse private key: ", err))
	} else {
		return parsedKey
	}
}

func getPublicKey() []byte {
	return []byte(`-----BEGIN PUBLIC KEY-----
    MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE9CR7SW0cTqQBG1vxWnkjk5dO7zfv
    UeueXgubjSD6i6vcmHdetZ25/ItESQDBmX0LL2qYaPzqTJHbWKxqL+6CtA==
    -----END PUBLIC KEY-----`)
}
