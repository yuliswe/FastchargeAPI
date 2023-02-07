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
	"github.com/shopspring/decimal"

	"github.com/Khan/genqlient/graphql"
)

var graphqlService string

var client = graphql.NewClient(graphqlService, http.DefaultClient)

/*
This service is expected to be put behind an authentication proxy such as an
aws authorizer. The role of this function is upon receiving a request:
 1. Look up from the resource server the destination url (makes use of a local
    cache).
 2. Send a request to the resource server to bill the usage (concurrently).
 3. Respond a redirect to the client with the destination url.
*/
func handler(request events.APIGatewayProxyRequest) (*events.APIGatewayProxyResponse, error) {
	if os.Getenv("DEV") == "1" {
		fmt.Println(color.Red + "DEV mode enabled" + color.Reset)
		graphqlService = "http://host.docker.internal:4000"
	} else {
		graphqlService = "http://internal.fastchargeapi.com:4000"
	}
	if response, err := handle(request); err == nil {
		return response, nil
	} else {
		response := apiGatewayErrorResponse(500, "INTERNAL_SERVER_ERROR", err.Error())
		return &response, err
	}
}

func handle(request events.APIGatewayProxyRequest) (*events.APIGatewayProxyResponse, error) {
	if os.Getenv("DEV") == "1" {
		fmt.Println(color.Red + "DEV mode enabled" + color.Reset)
	}
	fmt.Println(color.Yellow, "Request: ", request, color.Reset)
	path := request.Path
	app := strings.Split(request.Headers["Host"], ".")[0]
	user, errResp := getUser(request)
	if errResp != nil {
		return errResp, nil
	}
	if allowed, reason := userIsAllowedToAccess(user, app, path); !allowed {
		fmt.Println(color.Red, "User ", user, " is not allowed to access ", app, path, color.Reset)
		return reason, nil
	}
	fastchargeUserToken, err := createUserUsageToken(app, user)
	if err != nil {
		panic(fmt.Sprintln("Cannot generate _fct: ", err))
	}
	if destination, mode, found := getRoute(app, path); !found {
		response := apiGatewayErrorResponse(404, "NOT_FOUND", "Not Found: "+path)
		return &response, nil
	} else {
		switch mode {
		case RedirectMode:
			if response, err := makeRedirectResponse(destination, request, fastchargeUserToken); err != nil {
				fmt.Println(color.Red, "Error making a redirect response", err.Error(), color.Reset)
				return &response, err
			} else {
				billUsage(user, app, path)
				return &response, nil
			}
		default:
			if response, err := makeForwardResponse(destination, request, fastchargeUserToken); err != nil {
				fmt.Println(color.Red, "Error making a forward response", err.Error(), color.Reset)
				return response, err
			} else {
				billUsage(user, app, path)
				return response, nil
			}
		}
	}
}

func getUser(request events.APIGatewayProxyRequest) (string, *events.APIGatewayProxyResponse) {
	var userEmail string
	if os.Getenv("DEV") == "1" {
		userEmail = request.Headers["X-User-Email"]
	}
	if user, found := request.RequestContext.Authorizer["userEmail"]; found {
		userEmail = user.(string)
	}
	if userEmail == "" {
		response := apiGatewayErrorResponse(401, "UNAUTHORIZED", "You must be logged in to access this resource.")
		return "", &response
	} else {
		return userEmail, nil
	}
}

/*
Handles the request when the app route uses the redirect mode.
*/
func makeRedirectResponse(destination string, request events.APIGatewayProxyRequest, fastchargeUserToken string) (events.APIGatewayProxyResponse, error) {
	fmt.Println(color.Yellow+"Redirecting to", destination+color.Reset)
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
	fmt.Println(color.Yellow, "Forwarding to", destination, color.Reset)
	var destinationUrl *url.URL
	if url, err := url.Parse(destination); err != nil {
		response := apiGatewayErrorResponse(404, "NOT_FOUND", "Not Found: "+destination)
		return &response, nil
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
		fmt.Println(color.Red, "Error creating a forward request", err.Error(), color.Reset)
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

	// println(fmt.Scolor.Yellow("Forwarding request to ", destinationUrl.String(), urlParams.Encode()))
	// for k, v := range forwardRequest.Header {
	// 	color.Yellow(fmt.Println("Header: ", k, v))
	// }
	fmt.Println(color.Yellow, forwardRequest, color.Reset)
	if response, err := http.DefaultClient.Do(forwardRequest); err != nil {
		// println("Error: ", err.Error())
		response := apiGatewayErrorResponse(502, "BAD_GATEWAY", "Bad Gateway: "+err.Error())
		return &response, nil
	} else {
		var body []byte
		if err != nil {
			response := apiGatewayErrorResponse(502, "BAD_GATEWAY", "Bad Gateway: "+err.Error())
			return &response, nil
		}
		if response.Header.Get("Content-Encoding") == "gzip" {
			plaintext, err := gzip.NewReader(response.Body)
			defer plaintext.Close()
			if err != nil {
				response := apiGatewayErrorResponse(502, "BAD_GATEWAY", "Bad Gateway: "+err.Error())
				return &response, nil
			}
			body, err = io.ReadAll(plaintext)
			if err != nil {
				response := apiGatewayErrorResponse(502, "BAD_GATEWAY", "Bad Gateway: "+err.Error())
				return &response, nil
			}
		} else {
			body, err = io.ReadAll(response.Body)
			if err != nil {
				response := apiGatewayErrorResponse(502, "BAD_GATEWAY", "Bad Gateway: "+err.Error())
				return &response, nil
			}
		}
		headers := map[string]string{}
		for key, _ := range response.Header {
			headers[key] = response.Header.Get(key)
		}
		headers["Content-Encoding"] = "identity"
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

var routeCache = map[string]AppRouteInfo{}

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

/*
Gets the route from the cache. If the route is not in the cache, it will query
the resource server.
*/
func getRoute(app string, path string) (destination string, gatewayMode GatewayMode, err bool) {
	if appRoutes, ok := routeCache[app]; ok {
		if destination, ok := appRoutes.PathDestination[path]; ok {
			return destination, appRoutes.GatewayMode, true
		}
	}
	fmt.Println(color.Yellow, "Getting route for ", app, path, color.Reset)
	if routes, err := GetAppRoutes(context.Background(), client, app); err != nil {
		fmt.Println(color.Yellow, "Error getting routes for ", app, err, err, color.Reset)
	} else {
		fmt.Println(color.Yellow, "Got routes for ", app, routes, color.Reset)
		routeCache[app] = AppRouteInfo{
			GatewayMode:     parseGatewayMode(routes.App.GatewayMode),
			PathDestination: map[string]string{},
		}
		for _, endpoint := range routes.App.Endpoints {
			routeCache[app].PathDestination[endpoint.Path] = endpoint.Destination
		}
	}
	elem, found := routeCache[app].PathDestination[path]
	return elem, routeCache[app].GatewayMode, found
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

func billUsage(user string, app string, path string) {
	fmt.Println(color.Yellow, "Billing usage for", user, app, path, color.Reset)
	if result, err := BillUsage(context.Background(), client, user, app, path); err == nil {
		fmt.Println(color.Yellow, "Billing usage: ", result, color.Reset)
	} else {
		fmt.Println(color.Yellow, "Error billing usage: ", err, color.Reset)
	}
}

func apiGatewayErrorResponse(code int, reason string, message string) events.APIGatewayProxyResponse {
	body, _ := json.Marshal(map[string]string{
		"reason":  reason,
		"message": message,
	})
	return events.APIGatewayProxyResponse{
		StatusCode: code,
		Body:       string(body),
	}
}

func userIsAllowedToAccess(user string, app string, path string) (bool, *events.APIGatewayProxyResponse) {
	// In order to access an endpoint, the user must be subscribed to the app,
	// and have enough balance.
	var subscription GetUserSubscriptionPlanSubscriptionSubscribe
	if result, err := GetUserSubscriptionPlan(context.Background(), client, user, app); err == nil {
		response := apiGatewayErrorResponse(402, "NOT_SUBSCRIBED", "You are not subscribed to this app.")
		return false, &response
	} else {
		subscription = result.Subscription
	}
	cost := getEndpointCost(subscription, user, app, path)
	if getUserBalance(user).LessThan(cost) {
		response := apiGatewayErrorResponse(402, "INSUFFICIENT_BALANCE", "You need to have at least $"+cost.String()+"in your balance to access this endpoint.")
		return false, &response
	}
	return true, nil
}

func getUserBalance(user string) decimal.Decimal {
	if result, err := GetUserBalance(context.Background(), client, user); err == nil {
		if balance, err := decimal.NewFromString(result.User.Balance); err == nil {
			return balance
		} else {
			return decimal.NewFromInt(0)
		}
	} else {
		return decimal.NewFromInt(0)
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
			montly = decimal.NewFromInt(0)
		}
		cost = cost.Add(montly)
	}
	perCall, err := decimal.NewFromString(subscription.Pricing.ChargePerRequest) // in dollars
	if err != nil {
		perCall = decimal.NewFromInt(0)
	}
	cost = cost.Add(perCall)
	return cost
}

func getPrivousCallTime(user string, app string) int64 {
	if result, err := GetPreviousCallTimestamp(context.Background(), client, user, app); err != nil {
		fmt.Println(color.Yellow, "Error getting previous call timestamp: %s", err.Error(), color.Reset)
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

func main() {
	lambda.Start(handler)
}
