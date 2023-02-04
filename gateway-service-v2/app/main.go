package main

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"

	"github.com/Khan/genqlient/graphql"
)

const graphqlService = "http://host.docker.internal:4000"

var client = graphql.NewClient(graphqlService, http.DefaultClient)

/*
This service is expected to be put behind an authentication proxy such as an
aws authorizer. The role of this function is upon receiving a request:
 1. Look up from the resource server the destination url (makes use of a local
    cache).
 2. Send a request to the resource server to bill the usage (concurrently).
 3. Respond a redirect to the client with the destination url.
*/
func handler(request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	path := request.Path
	app := strings.Split(request.Headers["Host"], ".")[0]
	user := request.Headers["X-User-Email"]
	if user == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 401,
			Body:       "Unauthorized",
		}, nil
	}
	if fastchargeUserToken, err := createUserUsageToken(app, user); err != nil {
		panic(fmt.Sprintln("Cannot generate _fct: ", err))
	} else {
		if destination, mode, found := getRoute(app, path); found {
			switch mode {
			case RedirectMode:
				response, err := makeRedirectResponse(destination, request, fastchargeUserToken)
				if err == nil {
					billUsage(user, app, path)
				}
				return response, err
			default:
				response, err := makeProxyResponse(destination, request, fastchargeUserToken)
				if err == nil {
					billUsage(user, app, path)
				}
				return response, err
			}
		}
	}
	return events.APIGatewayProxyResponse{
		StatusCode: 500,
		Body:       "Internal Server Error",
	}, nil
}

/*
Handles the request when the app route uses the redirect mode.
*/
func makeRedirectResponse(destination string, request events.APIGatewayProxyRequest, fastchargeUserToken string) (events.APIGatewayProxyResponse, error) {
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
func makeProxyResponse(destination string, request events.APIGatewayProxyRequest, fastchargeUserToken string) (events.APIGatewayProxyResponse, error) {
	var destinationUrl *url.URL
	if url, err := url.Parse(destination); err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 404,
			Body:       "Not Found: " + destination,
		}, nil
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

	// Forward the parameters of the received request to the destination.
	urlParams := forwardRequest.URL.Query()
	urlParams.Add("_fct", fastchargeUserToken)
	for key, value := range request.QueryStringParameters {
		urlParams.Add(key, value)
	}
	if err != nil {
		panic("Cannot create request: " + err.Error())
	}

	// Forward the headers of the received request to the destination.
	for key, value := range request.Headers {
		forwardRequest.Header.Set(key, value)
	}
	forwardRequest.Header.Set("X-FCT", fastchargeUserToken)
	forwardRequest.Header.Set("Host", destinationUrl.Host)

	// println(fmt.Sprint("Forwarding request to ", destinationUrl.String(), urlParams.Encode()))
	// for k, v := range forwardRequest.Header {
	// 	print(fmt.Sprintln("Header: ", k, v))
	// }

	if response, err := http.DefaultClient.Do(forwardRequest); err != nil {
		// println("Error: ", err.Error())
		return events.APIGatewayProxyResponse{
			StatusCode: 504,
			Body:       "Gateway Timeout",
		}, nil
	} else {
		if body, err := io.ReadAll(response.Body); err != nil {
			return events.APIGatewayProxyResponse{
				StatusCode: 502,
				Body:       "Bad Gateway",
			}, nil
		} else {
			headers := map[string]string{}
			for key, _ := range response.Header {
				headers[key] = response.Header.Get(key)
			}
			return events.APIGatewayProxyResponse{
				StatusCode: response.StatusCode,
				Headers:    headers,
				Body:       string(body),
			}, nil
		}
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
	print(fmt.Sprintln("Getting route for ", app, path))
	if routes, err := GetAppRoutes(context.Background(), client, app); err != nil {
		print(fmt.Sprintln("Error getting routes for ", app, err, err))
	} else {
		print(fmt.Sprintln("Got routes for ", app, routes))
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
	println("Billing usage for", user, app, path)
	if result, err := BillUsage(context.Background(), client, user, app, path); err == nil {
		print(fmt.Sprintln("Billing usage: ", result))
	} else {
		print(fmt.Sprintln("Error billing usage: ", err))
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
