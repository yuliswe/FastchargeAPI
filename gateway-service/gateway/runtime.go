package main

import "os"

type RuntimeConfig struct {
	awsAccountId string
}

func getRuntimeConfig() RuntimeConfig {
	awsAccountId := "887279901853"

	if os.Getenv("DEV_DOMAIN") == "1" {
		awsAccountId = "209991057786"
	}

	return RuntimeConfig{
		awsAccountId: awsAccountId,
	}
}
