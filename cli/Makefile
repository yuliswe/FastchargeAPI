build:
	@echo "Getting schema from localhost:4000. If you don't have a local graphql server running this will fail."
	python3 -m sgqlc.introspection --exclude-deprecated --exclude-description http://localhost:4000 graphql_schema.json
	sgqlc-codegen schema graphql_schema.json ./fastcharge_cli/__generated__/schema.py
	cd ./fastcharge_cli/ && \
		sgqlc-codegen operation \
			--schema ../graphql_schema.json \
			schema \
			./__generated__/app_graphql.py \
			app.graphql
