package main

import (
	"encoding/json"

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
func lambdaHandler(request events.APIGatewayProxyRequest) (*events.APIGatewayProxyResponse, error) {
	if response, err := handle(request); err == nil {
		return response, nil
	} else {
		response := apiGatewayErrorResponse(500, "INTERNAL_SERVER_ERROR", err.Error())
		return response, err
	}
}

func handle(request events.APIGatewayProxyRequest) (*events.APIGatewayProxyResponse, error) {
	// body := string[]string
	// json.Unmarshal([]byte(request.Body), &body)
	bytes, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}
	return &events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(bytes),
	}, nil
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
