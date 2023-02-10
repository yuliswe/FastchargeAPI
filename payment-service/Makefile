.PNOHY: start-accept start-onboard

start-accept:
	stripe listen --forward-to https://api.payment.fastchargecli.com/accept -e "checkout.session.*"


start-onboard:
	stripe listen --forward-to https://api.payment.fastchargecli.com/onboard/accept -e "account.updated"


start:
	make start-accept & make start-onboard
