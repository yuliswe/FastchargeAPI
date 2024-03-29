package main

import (
	"fmt"
	// "io"
	"net/http"
	"os"

	"github.com/Khan/genqlient/graphql"
	"github.com/TwiN/go-color"
	"github.com/aws/aws-sdk-go/aws/session"
	v4 "github.com/aws/aws-sdk-go/aws/signer/v4"
	"github.com/sha1sum/aws_signing_client"
)

type CustomTransport struct {
	Headers map[string]string
}

func (self *CustomTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	for k, v := range self.Headers {
		req.Header.Add(k, v)
	}
	// fmt.Println(color.Green, "Sending request url", req.URL, req.Host, color.Reset)
	// fmt.Println(color.Green, "Sending request body", string(body), color.Reset)
	// fmt.Println(color.Green, "Sending request header", req.Header, color.Reset)
	resp, err := http.DefaultTransport.RoundTrip(req)
	// fmt.Println(color.Yellow, "Received response", resp, color.Reset)
	// fmt.Println(color.Yellow, "Received response err", err, color.Reset)
	return resp, err
}

func getGraphQLClient(additionalHeaders map[string]string) *graphql.Client {
	var graphqlService string
	if os.Getenv("LOCAL_GRAPHQL") == "1" {
		graphqlService = "http://host.docker.internal:4000"
		fmt.Println(color.Red, "Connecting to", graphqlService, color.Reset)
	} else if os.Getenv("DEV_DOMAIN") == "1" {
		graphqlService = "https://api.iam.graphql.devfastchargeapi.com"
		fmt.Println(color.Green, "Connecting to", graphqlService, color.Reset)
	} else {
		graphqlService = "https://api.iam.graphql.fastchargeapi.com"
		fmt.Println(color.Green, "Connecting to", graphqlService, color.Reset)
	}
	// doc https://github.com/sha1sum/aws_signing_client
	sess := session.Must(session.NewSession())
	credentials := sess.Config.Credentials
	var signer = v4.NewSigner(credentials)
	headers := map[string]string{
		"X-Service-Name": "gateway",
	}
	for k, v := range additionalHeaders {
		headers[k] = v
	}
	baseClient := http.Client{
		Transport: &CustomTransport{
			Headers: headers,
		},
	}
	if os.Getenv("LOCAL_GRAPHQL") == "1" {
		gqlClient := graphql.NewClient(graphqlService, &baseClient)
		return &gqlClient
	} else {
		awsClient, _ := aws_signing_client.New(signer, &baseClient, "execute-api", "us-east-1")
		gqlClient := graphql.NewClient(graphqlService, awsClient)
		return &gqlClient
	}
}
