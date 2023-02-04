.PHONY: build gen

build:
	make gen
	cd app && go build && rm app
	sam build

gen:
	go run github.com/Khan/genqlient
