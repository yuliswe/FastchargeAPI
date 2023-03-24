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

	"github.com/Khan/genqlient/graphql"
	"github.com/TwiN/go-color"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	lru "github.com/hashicorp/golang-lru/v2"
	httprouter "github.com/julienschmidt/httprouter"
)

func main() {
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
	headers := map[string]string{}
	for k, v := range request.Headers {
		headers[strings.ToLower(k)] = v
	}
	path := request.Path
	app, errResp := parseAppName(request)
	if errResp != nil {
		return errResp, nil
	}

	//fmt.Println("Identifying user")
	userEmail, errResp := parseUserEmail(headers, request.RequestContext)
	if errResp != nil {
		return errResp, nil
	}

	userPK, errResp := parseUserPK(headers, request.RequestContext)
	if errResp != nil {
		return errResp, nil
	}

	// This helps development locally by passing the X-User-Email/PK header to
	// local graphql server
	gqlClient := getGraphQLClient(map[string]string{
		"X-User-Email": userEmail,
		"X-User-PK":    userPK,
	})

	//fmt.Println("Checking is user is allowed to access app", app, "user:", user)
	startTimer := time.Now()
	decision, errorResponse := getGatewayRequestDecision(gqlClient, userPK, app, path)
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
	startTimer = time.Now()
	destination, mode, found := getRoute(gqlClient, request.HTTPMethod, app, path)
	stopTimer = time.Now()
	fmt.Println(color.Purple, "getRoute took", stopTimer.Sub(startTimer), color.Reset)
	if !found {
		response := apiGatewayErrorResponse(404, "NOT_FOUND", "Path Not Found: "+path)
		return response, nil
	}

	fastchargeUserToken := "" // TODO: implement this
	switch mode {
	case GatewayModeRedirect:
		if response, err := makeRedirectResponse(destination, request, fastchargeUserToken); err != nil {
			fmt.Println(color.Red, "Error making a redirect response", err, color.Reset)
			return &response, err
		} else {
			go billUsage(gqlClient, userPK, app, path, decision.PricingPK)
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
			go billUsage(gqlClient, userPK, app, path, decision.PricingPK)
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

func parseUserEmail(headers map[string]string, requestContext events.APIGatewayProxyRequestContext) (string, *events.APIGatewayProxyResponse) {
	var userEmail string
	if os.Getenv("TRUST_X_USER_EMAIL_HEADER") == "1" {
		fmt.Println(color.Red, "TRUST_X_USER_EMAIL_HEADER enabled. Reading user from the X-User-Email header.", color.Reset)
		userEmail = headers["x-user-email"]
		if userEmail == "" {
			fmt.Println(color.Red, "TRUST_X_USER_EMAIL_HEADER enabled. But the X-User-Email header is not set.", color.Reset)
			response := apiGatewayErrorResponse(401, "UNAUTHORIZED", "TRUST_X_USER_EMAIL_HEADER enabled. But the X-User-Email header is not set.")
			return "", response
		}
		fmt.Println(color.Blue, "X-User-Email header: ", userEmail, color.Reset)
		return userEmail, nil
	}
	if user, found := requestContext.Authorizer["userEmail"]; found {
		userEmail = user.(string)
		return userEmail, nil
	} else {
		fmt.Println(color.Red, "User email is not set by the authorizer", color.Reset)
		return "", nil
	}
}

func parseUserPK(headers map[string]string, requestContext events.APIGatewayProxyRequestContext) (string, *events.APIGatewayProxyResponse) {
	var userPK string
	if os.Getenv("TRUST_X_USER_PK_HEADER") == "1" {
		fmt.Println(color.Red, "TRUST_X_USER_PK_HEADER enabled. Reading user from the X-User-PK header.", color.Reset)
		userPK = headers["x-user-pk"]
		if userPK == "" {
			fmt.Println(color.Red, "TRUST_X_USER_PK_HEADER enabled. But the X-User-PK header is not set.", color.Reset)
			response := apiGatewayErrorResponse(401, "UNAUTHORIZED", "TRUST_X_USER_PK_HEADER enabled. But the X-User-PK header is not set.")
			return "", response
		}
		fmt.Println(color.Blue, "X-User-PK header: ", userPK, color.Reset)
		return userPK, nil
	}
	if user, found := requestContext.Authorizer["userPK"]; found {
		userPK = user.(string)
		return userPK, nil
	} else {
		fmt.Println(color.Red, "User email is not set by the authorizer", color.Reset)
		return "", nil
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
	// urlParams.Add("_fct", fastchargeUserToken)
	for key, value := range request.QueryStringParameters {
		urlParams.Add(key, value)
	}
	forwardRequest.URL.RawQuery = urlParams.Encode()

	// Forward the headers of the received request to the destination.
	for key, value := range request.Headers {
		forwardRequest.Header.Set(key, value)
	}
	// forwardRequest.Header.Set("X-FCT", fastchargeUserToken)
	forwardRequest.Header.Set("Host", destinationUrl.Host)
	forwardRequest.Header.Set("Accept-Encoding", "identity")
	for h, _ := range forwardRequest.Header {
		if strings.ToLower(h) == "x-api-key" {
			forwardRequest.Header.Del(h)
		}
	}
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
		for key := range response.Header {
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

var GetAppRoutesCache, _ = lru.New[string, *GetAppRoutesResponse](1000)
var getRouterCache, _ = lru.New[string, httprouter.Router](1000)

/*
Gets the route from the cache. If the route is not in the cache, it will query
the resource server.
*/
func getRoute(graphqlClient *graphql.Client, method string, app string, path string) (destination string, gatewayMode GatewayMode, found bool) {
	gatewayMode = GatewayModeProxy // TODO: not implemented

	appRoutes, found := GetAppRoutesCache.Get(app)
	if !found {
		routes, err := GetAppRoutes(context.Background(), *graphqlClient, app)
		appRoutes = routes
		if err != nil {
			fmt.Println(color.Red, "Error getting routes for", app, err, color.Reset)
			return "", gatewayMode, false
		}
		GetAppRoutesCache.Add(app, routes)
	}
	appRouter := httprouter.Router{}
	for _, endpoint := range appRoutes.App.Endpoints {
		// This is a bit of a hack. Calling this function will set the
		// destination variable to the endpoint's destination.
		processFn := func(w http.ResponseWriter, r *http.Request, p httprouter.Params) {
			destination = endpoint.Destination
		}
		switch endpoint.Method {
		case HTTPMethodGet:
			appRouter.GET(endpoint.Path, processFn)
		case HTTPMethodPost:
			appRouter.POST(endpoint.Path, processFn)
		case HTTPMethodPut:
			appRouter.PUT(endpoint.Path, processFn)
		case HTTPMethodDelete:
			appRouter.DELETE(endpoint.Path, processFn)
		case HTTPMethodPatch:
			appRouter.PATCH(endpoint.Path, processFn)
		case HTTPMethodHead:
			appRouter.HEAD(endpoint.Path, processFn)
		case HTTPMethodOptions:
			appRouter.OPTIONS(endpoint.Path, processFn)
		}
	}
	getRouterCache.Add(app, appRouter)
	processFn, params, _ := appRouter.Lookup(method, path)
	if processFn == nil {
		fmt.Println(color.Yellow, "No match for route", app, method, path, color.Reset)
		return "", gatewayMode, false
	}
	// Calling the processFn will set the destination variable to the endpoint's
	// destination.
	processFn(nil, nil, params)

	// path can be something like /posts/:id, and in this case, destination
	// should also have a param named :id, eg,
	// https://example.com/api/posts/:id. We need to replace the :id with the
	// value found in the request.
	for _, param := range params {
		destination = strings.Replace(destination, ":"+param.Key, param.Value, 1)
	}
	fmt.Println(color.Green, "Found route", app, method, path, destination, color.Reset)
	return destination, gatewayMode, true
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

func billUsage(graphqlClient *graphql.Client, user string, app string, path string, pricing string) {
	//fmt.Println(color.Yellow, "Billing usage for", user, app, path, color.Reset)

	// Creating usage log can be done synchronously. This ensures that when
	// calling TriggerBilling, the usage log is already created.
	if _, err := CreateUsageLog(
		context.Background(),
		*graphqlClient,
		user,
		app,
		path,
		pricing,
	); err != nil {
		fmt.Println(color.Red, "Error creating UsageLog: ", err, color.Reset)
	}
	// Trigger billing must be done on the billing queue.
	var billingGQLClient *graphql.Client
	if os.Getenv("LOCAL_GRAPHQL") == "1" {
		fmt.Println(color.Red, "Using local GraphQL in place of SQS", color.Reset)
		billingGQLClient = graphqlClient // Use normal GraphQL client (local in this case)
	} else {
		billingGQLClient = getSQSGraphQLClient(SQSGraphQLClientConfig{
			MessageDeduplicationId: fmt.Sprintf("trigger-billing-%s-%d", user, time.Now().Unix()),
			MessageGroupId:         "main",
			QueueUrl:               BillingFifoQueueUrl,
		})
	}
	if _, err := TriggerBilling(
		context.Background(),
		*billingGQLClient,
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
func getGatewayRequestDecision(graphqlClient *graphql.Client, userEmail string, app string, path string) (decision *CheckUserIsAllowedToCallEndpointCheckUserIsAllowedForGatewayRequestGatewayDecisionResponse, errorResponse *events.APIGatewayProxyResponse) {
	result, err := CheckUserIsAllowedToCallEndpoint(context.Background(), *graphqlClient, userEmail, app)
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
