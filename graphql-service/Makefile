watch:
	nodemon -e yml,ts,graphql -i ./apollo/__generated__ -i .aws-sam --signal SIGINT -x 'sam build && sam local start-api -p 4000 2>&1 | tr "\r" "\n" || exit 1'

