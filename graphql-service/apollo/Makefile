# This makefile is not intended to be run directly, but is used by AWS SAM as a
# build step.
BUILD_DIR = $(ARTIFACTS_DIR)/..
build-CopyDependencies:
	echo BUILD_DIR = $(BUILD_DIR) 

	echo 1 > "$(ARTIFACTS_DIR)/placeholder.txt"

	mkdir -p "$(BUILD_DIR)/ApolloServer"
	mkdir -p "$(BUILD_DIR)/ApolloServerIAM"
	mkdir -p "$(BUILD_DIR)/SQSApolloServer"
	mkdir -p "$(BUILD_DIR)/SettleAccountActivitiesCronJob"

	cp -r ./schema "$(BUILD_DIR)/ApolloServer/schema"
	cp -r ./schema "$(BUILD_DIR)/ApolloServerIAM/schema"
	cp -r ./schema "$(BUILD_DIR)/SQSApolloServer/schema"
	cp -r ./schema "$(BUILD_DIR)/SettleAccountActivitiesCronJob/schema"

# cp rtwrapper "$(BUILD_DIR)/ApolloServer/rtwrapper"
