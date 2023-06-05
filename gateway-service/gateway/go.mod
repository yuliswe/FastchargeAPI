module fastchargeapi.com/gateway

go 1.19

replace fastcharge.com/gateway-service/gateway => ./

require github.com/aws/aws-sdk-go v1.44.204

require (
	github.com/Khan/genqlient v0.5.0
	github.com/TwiN/go-color v1.4.0
	github.com/aws/aws-lambda-go v1.37.0
	github.com/hashicorp/golang-lru/v2 v2.0.1
	github.com/jmespath/go-jmespath v0.4.0 // indirect
	github.com/julienschmidt/httprouter v1.3.0
	github.com/sha1sum/aws_signing_client v0.0.0-20200229211254-f7815c59d5c1
	github.com/vektah/gqlparser/v2 v2.4.5 // indirect
)
