# This makefile is not intended to be run directly, but is used by AWS SAM as a
# build step.
build-CopyDependencies:
	echo *
	mkdir -p "$(ARTIFACTS_DIR)/../ApolloFunction/schema"
	cp ./schema/*.graphql "$(ARTIFACTS_DIR)/../ApolloFunction/schema"

