package main

import (
	"fmt"
	"io"
	"strings"

	"net/http"

	"github.com/Khan/genqlient/graphql"
	"github.com/TwiN/go-color"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/sqs"
	"github.com/google/uuid"
)

type SQSTransport struct {
	Headers                map[string]string
	SQSService             *sqs.SQS
	MessageDeduplicationId string
	DelaySeconds           int
}

func (self *SQSTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	for k, v := range self.Headers {
		req.Header.Add(k, v)
	}
	bodyBytes, _ := io.ReadAll(req.Body)
	body := string(bodyBytes)
	// fmt.Println("body", string(body))
	// fmt.Println(color.Green, "Sending request url", req.URL, req.Host, color.Reset)
	// fmt.Println(color.Green, "Sending request body", string(body), color.Reset)
	// fmt.Println(color.Green, "Sending request header", req.Header, color.Reset)
	var queue string
	if self.DelaySeconds >= 60 {
		queue = "https://sqs.us-east-1.amazonaws.com/887279901853/graphql-service-fifo-queue-delay-60s.fifo"
	} else if self.DelaySeconds >= 10 {
		queue = "https://sqs.us-east-1.amazonaws.com/887279901853/graphql-service-fifo-queue-delay-10s.fifo"
	} else {
		queue = "https://sqs.us-east-1.amazonaws.com/887279901853/graphql-service-fifo-queue.fifo"
	}
	messageGroupId := "gateway-service"
	messageDeduplicationId := ""
	if self.MessageDeduplicationId == "" {
		messageDeduplicationId = uuid.New().String()
	} else {
		messageDeduplicationId = self.MessageDeduplicationId
	}
	// var delaySeconds *int64
	// if self.DelaySeconds > 0 {
	// 	delaySeconds = &self.DelaySeconds
	// }
	_, err := self.SQSService.SendMessage(&sqs.SendMessageInput{
		MessageBody:            &body,
		MessageGroupId:         &messageGroupId,
		MessageDeduplicationId: &messageDeduplicationId,
		// DelaySeconds:           delaySeconds,
		QueueUrl: &queue,
	})
	if err != nil {
		fmt.Println(color.Red, "Error sending SQS message", err, color.Reset)
		return nil, err
	}
	// fmt.Println(color.Yellow, "Received response", resp, color.Reset)
	// fmt.Println(color.Yellow, "Received response err", err, color.Reset)
	return &http.Response{
		StatusCode: 200,
		Body:       io.NopCloser(strings.NewReader("{}")),
	}, nil
}

type SQSGraphQLClient struct {
	DedupID      string
	DelaySeconds int
}

func (self SQSGraphQLClient) New() graphql.Client {
	return getSQSGraphQLClient(self)
}

func getSQSGraphQLClient(config SQSGraphQLClient) graphql.Client {
	// doc https://github.com/sha1sum/aws_signing_client
	sess := session.Must(session.NewSession(&aws.Config{
		Region: aws.String("us-east-1"),
	}))
	baseClient := http.Client{
		Transport: &SQSTransport{
			Headers: map[string]string{
				"X-Service-Name": "gateway",
			},
			SQSService:             sqs.New(sess),
			MessageDeduplicationId: config.DedupID,
			DelaySeconds:           config.DelaySeconds,
		},
	}
	return graphql.NewClient("", &baseClient)
}

var DefaultSQSGqlClient graphql.Client

func initSQSGraphQLClient() {
	DefaultSQSGqlClient = getSQSGraphQLClient(SQSGraphQLClient{})
}
