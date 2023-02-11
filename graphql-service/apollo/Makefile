# This makefile is not intended to be run directly, but is used by AWS SAM as a
# build step.
build-CopyDependencies:
	mkdir -p "$(ARTIFACTS_DIR)/schema"
	cp ./schema/*.graphql "$(ARTIFACTS_DIR)/schema"
	mkdir -p "$(ARTIFACTS_DIR)/../ApolloServer/schema"
	cp ./schema/*.graphql "$(ARTIFACTS_DIR)/../ApolloServer/schema"
