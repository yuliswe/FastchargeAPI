.PHONY: build gen watch start

build:
	make gen
	cd app && go build && rm app
	sam build

start: 
	make build
	sam local start-api -p 5000

gen:
	go run github.com/Khan/genqlient

watch:
	nodemon -e go,graphql,yaml -i generated__graphql.go -x "DEV=1 make start || exit 1"
