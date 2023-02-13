.PHONY: watch
.DEFAULT: watch


build:
	sam build

start:
	sam build
	sam local start-api --warm-containers=eager -p 4000 2>&1 -n ./devenv.json | tr "\r" "\n"

watch:
	npx nodemon \
		-e yml,ts,graphql \
		-i ./apollo/__generated__ \
		-i .aws-sam \
		--signal SIGTERM \
		-x 'make start || exit 1'

