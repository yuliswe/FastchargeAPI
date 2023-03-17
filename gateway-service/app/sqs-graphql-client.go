package main

import (
	"fmt"
	"io"
	"os"
	"strings"

	"net/http"

	"github.com/Khan/genqlient/graphql"
	"github.com/TwiN/go-color"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/sqs"
)

type SQSTransport struct {
	Headers                map[string]string
	SQSService             *sqs.SQS
	MessageDeduplicationId string
	MessageGroupId         string
	QueueUrl               string
}

const (
	BillingFifoQueueUrl = "https://sqs.us-east-1.amazonaws.com/887279901853/graphql-service-billing-queue.fifo"
	UsageLogQueueUrl    = "https://sqs.us-east-1.amazonaws.com/887279901853/graphql-service-usage-log-queue"
)

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
	var messageGroupIdPtr *string
	if self.MessageGroupId != "" {
		messageGroupIdPtr = &self.MessageGroupId
	}
	var messageDeduplicationIdPtr *string
	if self.MessageDeduplicationId != "" {
		messageDeduplicationIdPtr = &self.MessageDeduplicationId
	}
	_, err := self.SQSService.SendMessage(&sqs.SendMessageInput{
		MessageBody:            &body,
		MessageGroupId:         messageGroupIdPtr,
		MessageDeduplicationId: messageDeduplicationIdPtr,
		QueueUrl:               &self.QueueUrl,
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

type SQSGraphQLClientConfig struct {
	MessageDeduplicationId string
	MessageGroupId         string
	QueueUrl               string
}

// Returns a GraphQL client that uses SQS as a transport layer.
//
// MessageDeduplicationId: Only for fifo queues. Sets the MessageDeduplicationId
// for the SQS message.
//
// MessageGroupId: Only for fifo queues. Sets the MessageGroupId for the SQS
// message delay_seconds: selects the SQS queue to use based on the
// delay_seconds. For the billing queue, this must be "main".
//
// Effectively, MessageDeduplicationId deduplicates messages with the same ID.
// Messages with the same MessageGroupId are processed in FIFO order.
func getSQSGraphQLClient(config SQSGraphQLClientConfig) *graphql.Client {
	if os.Getenv("LOCAL_GRAPHQL") == "1" {
		fmt.Println(color.Red, "Using local GraphQL in place of SQS", color.Reset)
		return getGraphQLClient() // Use normal GraphQL client (local in this case)
	}

	// Doc: https://github.com/sha1sum/aws_signing_client
	sess := session.Must(session.NewSession(&aws.Config{
		Region: aws.String("us-east-1"),
	}))
	if config.QueueUrl == BillingFifoQueueUrl {
		config.MessageGroupId = "main"
	}
	baseClient := http.Client{
		Transport: &SQSTransport{
			Headers: map[string]string{
				"X-Service-Name": "gateway",
			},
			SQSService:             sqs.New(sess),
			MessageDeduplicationId: config.MessageDeduplicationId,
			MessageGroupId:         config.MessageGroupId,
			QueueUrl:               config.QueueUrl,
		},
	}
	client := graphql.NewClient("", &baseClient)
	return &client
}
