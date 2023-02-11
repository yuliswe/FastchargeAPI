.PNOHY: start-accept-forward start-onboard-forward start-sam start watch

start-accept-forward:
	stripe listen --forward-to https://api.payment.fastchargecli.com/accept -e "checkout.session.*"


start-onboard-forward:
	stripe listen --forward-to https://api.payment.fastchargecli.com/onboard/accept -e "account.updated"


start:
	make start-accept-forward & \
	make start-onboard-forward & \
	make start-sam

start-sam:
	sam build && sam local start-api -p 3000 || exit 1

watch:
	make start-accept-forward & \
	make start-onboard-forward & \
	nodemon -e yml,py -i .aws-sam --signal SIGINT --warm-containers -x 'make start-sam || exit 1'
	