package main

import (
	"encoding/json"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
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
func lambdaHandler(request events.APIGatewayV2HTTPRequest) (*events.APIGatewayV2HTTPResponse, error) {
	if response, err := handle(request); err == nil {
		return response, nil
	} else {
		response := apiGatewayErrorResponse(500, "INTERNAL_SERVER_ERROR", err.Error())
		return response, err
	}
}

type EchoResponse = struct {
	Body        string            `json:"body"`
	Path        string            `json:"path"`
	Headers     map[string]string `json:"headers"`
	QueryParams map[string]string `json:"queryParams"`
}

func handle(request events.APIGatewayV2HTTPRequest) (*events.APIGatewayV2HTTPResponse, error) {
	// body := string[]string
	// json.Unmarshal([]byte(request.Body), &body)
	var bytes []byte
	var err error
	if os.Getenv("ECHO_EVENT") == "1" {
		bytes, err = json.Marshal(request)
	} else {
		bytes, err = json.Marshal(EchoResponse{
			Body:        request.Body,
			Headers:     request.Headers,
			QueryParams: request.QueryStringParameters,
			Path:        request.RawPath,
		})
	}
	if err != nil {
		return nil, err
	}
	if os.Getenv("LOG_RESPONSE") == "1" {
		os.Stdout.Write(bytes)
	}
	return &events.APIGatewayV2HTTPResponse{
		StatusCode: 200,
		Body:       string(bytes),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}, nil
}

func apiGatewayErrorResponse(code int, reason string, message string) *events.APIGatewayV2HTTPResponse {
	body, _ := json.Marshal(map[string]string{
		"reason":  reason,
		"message": message,
	})
	resp := events.APIGatewayV2HTTPResponse{
		StatusCode: code,
		Body:       string(body),
	}
	return &resp
}
