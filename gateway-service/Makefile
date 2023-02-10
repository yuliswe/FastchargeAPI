.PHONY: build gen watch start warm watch-warm

build:
	make gen
	cd app && go build && rm app
	sam build

start: 
	make build
	DEV=1 sam local start-api -p 6000

warm:
	make build
	DEV=1 sam local start-api -p 6000 --warm-containers eager

gen:
	go run github.com/Khan/genqlient

watch:
	nodemon -e go,graphql,yaml -i generated__graphql.go --signal SIGINT -x "make start || exit 1"

watch-warm:
	nodemon -e go,graphql,yaml -i generated__graphql.go --signal SIGINT -x "make warm || exit 1"
