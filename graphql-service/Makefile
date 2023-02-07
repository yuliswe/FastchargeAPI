watch:
	nodemon -e yml,ts,graphql -i ./apollo/__generated__ -i .aws-sam --exec 'sam build && sam local start-api -p 4000 2>&1 | tr "\r" "\n" || exit 1'

