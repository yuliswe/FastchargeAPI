.PHONY: build gen watch start warm watch-warm

build:
	make gen
	cd app && go build && rm app
	sam build

start: 
	make build
	sam local start-api -p 6000 --env-vars ./devenv.json

warm:
	make build
	sam local start-api -p 6000 --warm-containers eager --env-vars ./devenv.json

gen:
	go run github.com/Khan/genqlient

watch:
	nodemon -e go,graphql,yaml -i generated__graphql.go --signal SIGINT -x "make start || exit 1"

watch-warm:
	nodemon -e go,graphql,yaml -i generated__graphql.go --signal SIGINT -x "make warm || exit 1"
